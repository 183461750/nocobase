import { css } from '@emotion/css';
import { FormLayout } from '@formily/antd-v5';
import { createForm, Field, Form as FormilyForm, onFieldInit, onFormInputChange } from '@formily/core';
import { FieldContext, FormContext, observer, RecursionField, useField, useFieldSchema } from '@formily/react';
import { reaction } from '@formily/reactive';
import { uid } from '@formily/shared';
import { ConfigProvider, Spin } from 'antd';
import _ from 'lodash';
import React, { useEffect, useMemo } from 'react';
import { useActionContext } from '..';
import { useAttach, useComponent } from '../..';
import { DEBOUNCE_WAIT, useLocalVariables, useVariables } from '../../../variables';
import { getPath } from '../../../variables/utils/getPath';
import { getVariableName } from '../../../variables/utils/getVariableName';
import { isVariable, REGEX_OF_VARIABLE } from '../../../variables/utils/isVariable';
import { useProps } from '../../hooks/useProps';
import { linkageMergeAction } from './utils';

export interface FormProps {
  [key: string]: any;
}

const FormComponent: React.FC<FormProps> = (props) => {
  const { form, children, ...others } = props;
  const field = useField();
  const fieldSchema = useFieldSchema();
  // TODO: component 里 useField 会与当前 field 存在偏差
  const f = useAttach(form.createVoidField({ ...field.props, basePath: '' }));
  return (
    <FieldContext.Provider value={undefined}>
      <FormContext.Provider value={form}>
        <FormLayout layout={'vertical'} {...others}>
          <RecursionField basePath={f.address} schema={fieldSchema} onlyRenderProperties />
        </FormLayout>
      </FormContext.Provider>
    </FieldContext.Provider>
  );
};

const Def = (props: any) => props.children;

const FormDecorator: React.FC<FormProps> = (props) => {
  const { form, children, disabled, ...others } = props;
  const field = useField();
  const fieldSchema = useFieldSchema();
  // TODO: component 里 useField 会与当前 field 存在偏差
  const f = useAttach(form.createVoidField({ ...field.props, basePath: '' }));
  const Component = useComponent(fieldSchema['x-component'], Def);
  return (
    <FieldContext.Provider value={undefined}>
      <FormContext.Provider value={form}>
        <FormLayout layout={'vertical'} {...others}>
          <FieldContext.Provider value={f}>
            <Component {...field.componentProps}>
              <RecursionField basePath={f.address} schema={fieldSchema} onlyRenderProperties />
            </Component>
          </FieldContext.Provider>
          {/* <FieldContext.Provider value={f}>{children}</FieldContext.Provider> */}
        </FormLayout>
      </FormContext.Provider>
    </FieldContext.Provider>
  );
};

const getLinkageRules = (fieldSchema) => {
  let linkageRules = null;
  fieldSchema.mapProperties((schema) => {
    if (schema['x-linkage-rules']) {
      linkageRules = schema['x-linkage-rules'];
    }
  });
  return linkageRules;
};

interface WithFormProps {
  form: FormilyForm;
  disabled?: boolean;
}

const WithForm = (props: WithFormProps) => {
  const { form } = props;
  const fieldSchema = useFieldSchema();
  const { setFormValueChanged } = useActionContext();
  const variables = useVariables();
  const localVariables = useLocalVariables({ currentForm: form });
  const linkageRules: any[] =
    (getLinkageRules(fieldSchema) || fieldSchema.parent?.['x-linkage-rules'])?.filter((k) => !k.disabled) || [];

  useEffect(() => {
    const id = uid();

    form.addEffects(id, () => {
      onFormInputChange(() => {
        setFormValueChanged?.(true);
      });
    });

    if (props.disabled) {
      form.disabled = props.disabled;
    }

    return () => {
      form.removeEffects(id);
    };
  }, [props.disabled]);

  useEffect(() => {
    const id = uid();
    const disposes = [];

    form.addEffects(id, () => {
      linkageRules.forEach((v) => {
        v.actions?.forEach((h) => {
          if (h.targetFields?.length) {
            const fields = h.targetFields.join(',');

            // 当 `linkageRules` 变更时，需要把 `field` 上之前已设置的值还原成初始值，以防止下面所述的情况：
            //
            // 1. 更改 `linkageRules`，使 a 字段满足条件时被隐藏
            // 2. 设置表单，使其满足条件，进而隐藏 a 字段
            // 3. 再次更改 `linkageRules`，使 a 字段满足条件时被禁用
            // 4. 设置表单，使其满足条件，会发现 a 字段还是隐藏状态，这里期望的是只显示禁用状态
            onFieldInit(`*(${fields})`, (field: any) => {
              Object.keys(field).forEach((key) => {
                if (key.startsWith('_') && field[key] !== undefined) {
                  field[key.slice(1)] = field[key];
                }
              });
            });

            // `onFieldReact` 有问题，没有办法被取消监听，所以这里用 `onFieldInit` 代替
            onFieldInit(`*(${fields})`, (field: any, form) => {
              const _run = () =>
                linkageMergeAction({
                  operator: h.operator,
                  value: h.value,
                  field,
                  condition: v.condition,
                  values: form?.values,
                  variables,
                  localVariables,
                });

              // 使用防抖，提高性能和用户体验
              const run = _.debounce(_run, DEBOUNCE_WAIT);

              _run();

              disposes.push(
                reaction(() => {
                  const expressString = h.value?.value || h.value?.result;

                  const result = expressString.match(REGEX_OF_VARIABLE)?.map((variableString) => {
                    if (!isVariable(variableString)) {
                      return;
                    }

                    const variableName = getVariableName(variableString);
                    const variableValue = localVariables.find((item) => item.name === variableName);

                    if (variableValue) {
                      return _.get({ [variableName]: variableValue?.ctx }, getPath(variableString));
                    }
                  });

                  return JSON.stringify(result);
                }, run),
              );
            });
          }
        });
      });
    });

    return () => {
      form.removeEffects(id);
      disposes.forEach((dispose) => {
        dispose();
      });
    };
  }, [JSON.stringify(linkageRules)]);

  return fieldSchema['x-decorator'] === 'FormV2' ? <FormDecorator {...props} /> : <FormComponent {...props} />;
};

const WithoutForm = (props) => {
  const fieldSchema = useFieldSchema();
  const { setFormValueChanged } = useActionContext();
  const form = useMemo(
    () =>
      createForm({
        disabled: props.disabled,
        effects() {
          onFormInputChange((form) => {
            setFormValueChanged?.(true);
          });
        },
      }),
    [],
  );
  return fieldSchema['x-decorator'] === 'FormV2' ? (
    <FormDecorator form={form} {...props} />
  ) : (
    <FormComponent form={form} {...props} />
  );
};

export const Form: React.FC<FormProps> & {
  Designer?: any;
  FilterDesigner?: any;
  ReadPrettyDesigner?: any;
  Templates?: any;
} = observer(
  (props) => {
    const field = useField<Field>();
    const { form, disabled, ...others } = useProps(props);
    const formDisabled = disabled || field.disabled;
    return (
      <ConfigProvider componentDisabled={formDisabled}>
        <form
          className={css`
            .ant-formily-item-feedback-layout-loose {
              margin-bottom: 12px;
            }
          `}
        >
          <Spin spinning={field.loading || false}>
            {form ? (
              <WithForm form={form} {...others} disabled={formDisabled} />
            ) : (
              <WithoutForm {...others} disabled={formDisabled} />
            )}
          </Spin>
        </form>
      </ConfigProvider>
    );
  },
  { displayName: 'Form' },
);
