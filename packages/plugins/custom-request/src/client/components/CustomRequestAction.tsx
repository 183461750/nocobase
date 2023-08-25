import { Action, useAPIClient } from '@nocobase/client';
import React from 'react';
import { CustomRequestActionDesigner } from './CustomRequestActionDesigner';
import { useGetCustomRequest } from '../hooks';
import { useFieldSchema } from '@formily/react';

export const CustomRequestActionACL = (props) => {
  const { data } = useGetCustomRequest();
  const apiClient = useAPIClient();
  if (!data) {
    return null;
  }
  if (
    data.data?.roles?.length &&
    !data.data.roles.find((role) => {
      return role.name === apiClient.auth.role;
    })
  ) {
    return null;
  }

  return props.children;
};

const components = {
  'customize:table:request': Action.Link,
};

export const CustomRequestAction = (props) => {
  const fieldSchema = useFieldSchema();
  const xAction = fieldSchema['x-action'];
  const Component = components[xAction] || Action;
  return (
    <CustomRequestActionACL>
      <Component {...props}></Component>
    </CustomRequestActionACL>
  );
};

CustomRequestAction.Designer = CustomRequestActionDesigner;
