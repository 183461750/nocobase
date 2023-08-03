import { css } from '@emotion/css';
import { Field } from '@formily/core';
import { connect, useField, useFieldSchema } from '@formily/react';
import { merge } from '@formily/shared';
import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFormBlockContext } from '../../../block-provider';
import {
  CollectionFieldProvider,
  useCollection,
  useCollectionField,
  useCollectionFilterOptions,
} from '../../../collection-manager';
import { Variable, useCompile, useComponent, useVariableScope } from '../../../schema-component';
import { useUserVariable } from '../../../schema-settings/VariableInput/hooks/useUserVariable';
import { DeletedField } from '../DeletedField';

const InternalField: React.FC = (props) => {
  const field = useField<Field>();
  const fieldSchema = useFieldSchema();
  const { uiSchema } = useCollectionField();
  const component = useComponent(uiSchema?.['x-component']);
  const compile = useCompile();
  const setFieldProps = (key, value) => {
    field[key] = typeof field[key] === 'undefined' ? value : field[key];
  };
  const setRequired = () => {
    if (typeof fieldSchema['required'] === 'undefined') {
      field.required = !!uiSchema['required'];
    }
  };
  const ctx = useFormBlockContext();

  useEffect(() => {
    if (ctx?.field) {
      ctx.field.added = ctx.field.added || new Set();
      ctx.field.added.add(fieldSchema.name);
    }
  });

  useEffect(() => {
    if (!uiSchema) {
      return;
    }
    setFieldProps('content', uiSchema['x-content']);
    setFieldProps('title', uiSchema.title);
    setFieldProps('description', uiSchema.description);
    setFieldProps('initialValue', uiSchema.default);
    // if (!field.validator && uiSchema['x-validator']) {
    //   field.validator = uiSchema['x-validator'];
    // }
    if (fieldSchema['x-disabled'] === true) {
      field.disabled = true;
    }
    if (fieldSchema['x-read-pretty'] === true) {
      field.readPretty = true;
    }
    setRequired();
    // @ts-ignore
    field.dataSource = uiSchema.enum;
    const originalProps = compile(uiSchema['x-component-props']) || {};
    const componentProps = merge(originalProps, field.componentProps || {});
    field.componentProps = componentProps;
    // field.component = [component, componentProps];
  }, [JSON.stringify(uiSchema)]);
  if (!uiSchema) {
    return null;
  }
  return React.createElement(component, props, props.children);
};

const CollectionField = connect((props) => {
  const fieldSchema = useFieldSchema();
  return (
    <CollectionFieldProvider name={fieldSchema.name} fallback={<DeletedField />}>
      <InternalField {...props} />
    </CollectionFieldProvider>
  );
});

export enum AssignedFieldValueType {
  ConstantValue = 'constantValue',
  DynamicValue = 'dynamicValue',
}

export const AssignedField = (props: any) => {
  const { value, onChange } = props;
  const { t } = useTranslation();
  const compile = useCompile();
  const fieldSchema = useFieldSchema();
  const { getField } = useCollection();
  const collectionField = getField(fieldSchema.name);
  const [options, setOptions] = useState<any[]>([]);
  const collection = useCollection();
  const fields = compile(useCollectionFilterOptions(collection));
  const scope = useVariableScope();
  const userVariable = useUserVariable({ schema: collectionField.uiSchema });

  userVariable.value = getNameOfUserVariable(value);

  useEffect(() => {
    const opt = [
      {
        value: getNameOfRecordVariable(value),
        label: t('Current record'),
        children: fields,
      },
      userVariable,
    ];
    if (['createdAt', 'datetime', 'time', 'updatedAt'].includes(collectionField?.interface)) {
      opt.unshift({
        value: 'currentTime',
        label: t('Current time'),
        children: null,
      });
    }
    const next = opt.concat(scope);
    setOptions(next);
  }, [fields, scope]);

  return (
    <Variable.Input
      value={value}
      onChange={onChange}
      scope={options}
      className={css`
        .variable {
          width: 100%;
        }
      `}
      // fieldNames={{
      //   label: 'title',
      //   value: 'name',
      // }}
    >
      <CollectionField value={value} onChange={onChange} />
    </Variable.Input>
  );
};

/**
 * 为了兼容老版本的变量字符串（`currentRecord` -> `$record`）
 * @param value
 * @returns
 */
function getNameOfRecordVariable(value: any) {
  if (!_.isString(value)) {
    return '$record';
  }

  // 兼容老版本
  if (value.includes('currentRecord')) {
    return 'currentRecord';
  }

  return '$record';
}

/**
 * `currentUser` -> `$user`
 * @param value
 * @returns
 */
function getNameOfUserVariable(value: any) {
  if (!_.isString(value)) {
    return '$user';
  }

  // 兼容老版本
  if (value.includes('currentUser')) {
    return 'currentUser';
  }

  return '$user';
}
