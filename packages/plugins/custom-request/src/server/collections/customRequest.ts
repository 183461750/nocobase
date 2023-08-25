import { CollectionOptions } from '@nocobase/client';

export default {
  namespace: 'custom-requests',
  duplicator: 'optional',
  name: 'customRequests',
  title: '{{t("Custom request")}}',
  fields: [
    {
      type: 'uid',
      name: 'key',
      primaryKey: true,
    },
    {
      type: 'string',
      name: 'title',
      title: '{{t("Title")}}',
    },
    {
      type: 'belongsToMany',
      name: 'roles',
      onDelete: 'CASCADE',
      through: 'customRequestsRoles',
      target: 'roles',
      foreignKey: 'customRequestId',
      otherKey: 'roleName',
      sourceKey: 'key',
      targetKey: 'name',
    },
    {
      type: 'json',
      name: 'options', // 配置的请求参数都放这里
    },
  ],
} as CollectionOptions;
