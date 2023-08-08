import { createForm } from '@formily/core';
import { Schema, useField, useFieldSchema, useForm } from '@formily/react';
import { Spin } from 'antd';
import flat from 'flat';
import uniq from 'lodash/uniq';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { SchemaComponentOptions } from '../';
import { useAssociationCreateActionProps as useCAP } from '../block-provider/hooks';
import { useCollectionManager } from '../collection-manager';
import { RecordProvider } from '../record-provider';
import { BlockProvider, useBlockRequestContext } from './BlockProvider';

export const KanbanV2BlockContext = createContext<any>({});

const InternalKanbanV2BlockProvider = (props) => {
  const { action, readPretty } = props;
  const field = useField<any>();
  const form = useMemo(
    () =>
      createForm({
        readPretty,
      }),
    [],
  );
  const { resource, service } = useBlockRequestContext();
  if (service.loading && !field.loaded) {
    return <Spin />;
  }
  field.loaded = true;
  return (
    <KanbanV2BlockContext.Provider
      value={{
        ...props,
        action,
        form,
        field,
        service,
        resource,
      }}
    >
      <RecordProvider record={service?.data?.data?.[0] || {}}>{props.children}</RecordProvider>
    </KanbanV2BlockContext.Provider>
  );
};

export const KanbanCardContext = createContext<any>({});

export const KanbanCardBlockProvider = (props) => {
  const { item } = props;
  const field = useField<any>();
  const form = useMemo(
    () =>
      createForm({
        readPretty: true,
        initialValues: item,
      }),
    [item],
  );

  field.loaded = true;
  return (
    <KanbanCardContext.Provider
      value={{
        ...props,
        form,
        field,
      }}
    >
      <RecordProvider record={item || {}}>{props.children}</RecordProvider>
    </KanbanCardContext.Provider>
  );
};

const recursiveProperties = (schema: Schema, component = 'CollectionField', associationFields, appends: any = []) => {
  schema.mapProperties((s: any) => {
    const name = s.name.toString();
    if (s['x-component'] === component && !appends.includes(name)) {
      // 关联字段和关联的关联字段
      const [firstName] = name.split('.');
      if (associationFields.has(name)) {
        appends.push(name);
      } else if (associationFields.has(firstName) && !appends.includes(firstName)) {
        appends.push(firstName);
      }
    } else {
      recursiveProperties(s, component, associationFields, appends);
    }
  });
};
const useAssociationNames = (collection) => {
  const { getCollectionFields } = useCollectionManager();
  const collectionFields = getCollectionFields(collection);
  const associationFields = new Set();
  for (const collectionField of collectionFields) {
    if (collectionField.target) {
      associationFields.add(collectionField.name);
      const fields = getCollectionFields(collectionField.target);
      for (const field of fields) {
        if (field.target) {
          associationFields.add(`${collectionField.name}.${field.name}`);
        }
      }
    }
  }
  const fieldSchema = useFieldSchema();
  const kanbanSchema = fieldSchema.reduceProperties((buf, schema) => {
    if (schema['x-component'].startsWith('KanbanV2')) {
      return schema;
    }
    return buf;
  }, new Schema({}));
  const gridSchema: any = kanbanSchema?.properties?.grid;
  const appends = [];
  if (gridSchema) {
    recursiveProperties(gridSchema, 'CollectionField', associationFields, appends);
  }

  return uniq(appends);
};

const useGroupField = (props) => {
  const { getCollectionFields } = useCollectionManager();
  const { groupField, collection } = props;
  const fields = getCollectionFields(collection);
  return fields.find((v) => v.name === groupField[0]);
};

export const KanbanV2BlockProvider = (props) => {
  const { columns, collection } = props;
  const params = { ...props.params };
  const appends = useAssociationNames(collection);
  const groupField: any = useGroupField(props);
  const [kanbanColumns, setKanbanColumns] = useState(columns);
  const [targetColumn, setTargetColumn] = useState(null);

  useEffect(() => {
    const Columns = columns?.filter((v) => v.enabled) || [];
    Columns.push({
      value: '__unknown__',
      label: 'Unknown',
      color: 'default',
      cards: null,
    });
    setKanbanColumns(Columns);
  }, []);
  if (!groupField) {
    return null;
  }
  if (!Object.keys(params).includes('appends')) {
    params['appends'] = appends;
  }

  params['filter'] = props.params.filter;

  const useCreateActionProps = () => {
    const form = useForm();
    const { onClick } = useCAP();
    const values = flat(form.values);
    return {
      async onClick() {
        await onClick();
        const targetKey = props.groupField.join('.');
        const target = values[targetKey] || '__unknown__';
        setTargetColumn(null);
        setTimeout(() => {
          setTargetColumn(target);
        });
      },
    };
  };
  return (
    <SchemaComponentOptions scope={{ useCreateActionProps }}>
      <BlockProvider {...props} params={params}>
        <InternalKanbanV2BlockProvider
          {...props}
          params={params}
          groupField={groupField}
          associateCollectionField={props.groupField}
          columns={kanbanColumns}
          targetColumn={targetColumn}
        />
      </BlockProvider>
    </SchemaComponentOptions>
  );
};

export const useKanbanV2BlockContext = () => {
  return useContext(KanbanV2BlockContext);
};

export const useKanbanV2BlockProps = () => {
  const ctx = useKanbanV2BlockContext();
  const field: any = useField();
  const { columns } = ctx;
  useEffect(() => {
    if (!ctx?.service?.loading) {
      field.value = ctx?.service?.data?.data;
      // eslint-disable-next-line promise/catch-or-return
      ctx.form?.reset().then(() => {
        ctx.form.setValues(ctx.service?.data?.data?.[0] || {});
      });
    }
  }, [ctx?.service?.loading]);
  return {
    columns: columns,
    groupField: ctx.groupField,
    form: ctx.form,
  };
};
