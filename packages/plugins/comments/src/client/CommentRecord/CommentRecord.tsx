import { ArrayTable } from '@formily/antd';
import { observer, useField } from '@formily/react';
import { FormProvider, SchemaComponent, useCompile, useRecord, ReadPretty } from '@nocobase/client';
import React, { createContext, useContext } from 'react';
import { CommentItem, getContent } from '../CommentBlock/CommentBlock';
import { useCommentTranslation } from '../locale';
import { CommentRecordDecorator } from './CommentRecord.Decorator';
import { CommentRecordDesigner } from './CommentRecord.Designer';

export const Username = observer(() => {
  const field = useField<any>();
  return <div>{field?.value?.nickname || field.value?.id}</div>;
});

export const PlainText = observer(() => {
  const field = useField<any>();
  const compile = useCompile();
  return <div>{compile(field.value)}</div>;
});

export const Field = observer(() => {
  const field = useField<any>();
  const compile = useCompile();
  if (!field.value) {
    return null;
  }
  return <div>{field.value?.uiSchema?.title ? compile(field.value?.uiSchema?.title) : field.value.name}</div>;
});

export const Value = observer(() => {
  const field = useField<any>();
  const record = ArrayTable.useRecord();
  if (record.field?.uiSchema) {
    return (
      <FormProvider>
        <SchemaComponent
          schema={{
            name: record.field.name,
            ...record.field?.uiSchema,
            default: field.value,
            'x-read-pretty': true,
          }}
        />
      </FormProvider>
    );
  }
  return <div>{field.value ? JSON.stringify(field.value) : null}</div>;
});

export const Commenter = observer(() => {
  const field = useField<any>();
  if (!field.value) {
    return null;
  }
  return <div>{field.value.nickname}</div>;
});

export const CommentContent = observer(() => {
  const record = useRecord();
  const content = getContent(record as CommentItem);

  return (
    <ReadPretty.Html
      ellipsis
      forceHtmlEllipsis
      value={content}
      htmlStyle={{ overflow: 'hidden', textOverflow: 'ellipsis' }}
    />
  );
});

export const IsAssociationBlock = createContext(null);

export const useCommentRecordSchema: any = () => {
  const { t } = useCommentTranslation();
  return {
    type: 'void',
    name: 'lfm4trkw8j3',
    'x-component': 'div',
    properties: {
      actions: {
        type: 'void',
        'x-component': 'ActionBar',
        'x-component-props': {
          style: {
            marginBottom: 16,
          },
        },
        properties: {
          filter: {
            type: 'void',
            title: '{{ t("Filter") }}',
            'x-action': 'filter',
            'x-component': 'Filter.Action',
            'x-component-props': {
              icon: 'FilterOutlined',
              useProps: '{{ useFilterActionProps }}',
            },
            'x-align': 'left',
          },
        },
      },
      y84dlntcaup: {
        type: 'array',
        'x-component': 'TableV2',
        'x-component-props': {
          rowKey: 'id',
          rowSelection: {
            type: 'checkbox',
          },
          useProps: '{{ useTableBlockProps }}',
        },
        properties: {
          actions: {
            type: 'void',
            title: '{{ t("Actions") }}',
            'x-action-column': 'actions',
            'x-decorator': 'TableV2.Column.ActionBar',
            'x-component': 'TableV2.Column',
            'x-designer': 'TableV2.ActionColumnDesigner',
            'x-initializer': 'TableActionColumnInitializers',
            properties: {
              actions: {
                type: 'void',
                'x-decorator': 'DndContext',
                'x-component': 'Space',
                'x-component-props': {
                  split: '|',
                },
                properties: {
                  o80rypwmeeg: {
                    type: 'void',
                    title: '{{ t("View") }}',
                    'x-designer': 'Action.Designer',
                    'x-component': 'Action.Link',
                    'x-component-props': {
                      openMode: 'drawer',
                    },
                    properties: {
                      drawer: {
                        type: 'void',
                        title: '{{ t("View record") }}',
                        'x-component': 'Action.Container',
                        'x-component-props': {
                          className: 'nb-action-popup',
                        },
                        properties: {
                          grid: {
                            type: 'void',
                            'x-component': 'Grid',
                            properties: {
                              tdlav8o9o17: {
                                type: 'void',
                                'x-component': 'Grid.Row',
                                properties: {
                                  '7bsnaf47i6g': {
                                    type: 'void',
                                    'x-component': 'Grid.Col',
                                    properties: {
                                      commentBlock: {
                                        type: 'void',
                                        'x-designer': 'CommentBlock.Designer',
                                        'x-decorator': 'CommentBlock.Decorator',
                                        'x-component': 'CommentBlock',
                                        'x-component-props': {
                                          from: 'commentRecord',
                                        },
                                      },
                                    },
                                  },
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          column1: {
            type: 'void',
            'x-decorator': 'TableV2.Column.Decorator',
            'x-designer': 'TableV2.Column.Designer',
            'x-component': 'TableV2.Column',
            properties: {
              createdAt: {
                'x-component': 'CollectionField',
                'x-read-pretty': true,
              },
            },
          },
          columnContent: {
            type: 'void',
            'x-decorator': 'TableV2.Column.Decorator',
            'x-designer': 'TableV2.Column.Designer',
            'x-component': 'TableV2.Column',
            'x-component-props': {
              ellipsis: true,
            },
            title: t('Comment content'),
            properties: {
              content: {
                'x-component': 'CommentContent',
                'x-read-pretty': true,
              },
            },
          },
          columnCollectioName: {
            type: 'void',
            'x-decorator': 'TableV2.Column.Decorator',
            'x-designer': 'TableV2.Column.Designer',
            'x-component': 'TableV2.Column',
            title: t('Collection name'),
            properties: {
              'collection.name': {
                'x-component': 'PlainText',
                'x-read-pretty': true,
              },
            },
          },
          columnCollectionTitle: {
            type: 'void',
            'x-decorator': 'TableV2.Column.Decorator',
            'x-designer': 'TableV2.Column.Designer',
            'x-component': 'TableV2.Column',
            title: t('Collection title'),
            properties: {
              'collection.title': {
                'x-component': 'PlainText',
                'x-read-pretty': true,
              },
            },
          },
          columnFieldTitle: {
            type: 'void',
            'x-decorator': 'TableV2.Column.Decorator',
            'x-designer': 'TableV2.Column.Designer',
            'x-component': 'TableV2.Column',
            title: t('Record title'),
            properties: {
              recordTitle: {
                'x-component': 'PlainText',
                'x-read-pretty': true,
              },
            },
          },
          columnRecordId: {
            type: 'void',
            'x-decorator': 'TableV2.Column.Decorator',
            'x-designer': 'TableV2.Column.Designer',
            'x-component': 'TableV2.Column',
            title: '{{t("Record ID")}}',
            properties: {
              recordId: {
                'x-component': 'PlainText',
                'x-read-pretty': true,
              },
            },
          },
          columnCommenter: {
            type: 'void',
            'x-decorator': 'TableV2.Column.Decorator',
            'x-designer': 'TableV2.Column.Designer',
            'x-component': 'TableV2.Column',
            title: t('Commenter'),
            properties: {
              createdBy: {
                'x-component': 'Commenter',
                'x-read-pretty': true,
              },
            },
          },
        },
      },
    },
  };
};
