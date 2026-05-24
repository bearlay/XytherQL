export type SchemaGraphDisplayOptions = {
  skipRelay?: boolean;
  skipDeprecated?: boolean;
  showLeafFields?: boolean;
  sortByAlphabet?: boolean;
};

export type IntrospectionTypeRef = {
  kind?: string;
  name?: string | null;
  ofType?: IntrospectionTypeRef | null;
};

export type IntrospectionField = {
  name: string;
  description?: string | null;
  isDeprecated?: boolean;
  deprecationReason?: string | null;
  type?: IntrospectionTypeRef | null;
  args?: Array<{
    name: string;
    description?: string | null;
    type?: IntrospectionTypeRef | null;
    defaultValue?: string | null;
  }>;
};

export type IntrospectionType = {
  kind: string;
  name: string;
  description?: string | null;
  fields?: IntrospectionField[] | null;
  inputFields?: IntrospectionField[] | null;
  interfaces?: Array<{ name: string }> | null;
  possibleTypes?: Array<{ name: string }> | null;
  enumValues?: Array<{
    name: string;
    description?: string | null;
    isDeprecated?: boolean;
  }> | null;
};

export type IntrospectionSchema = {
  queryType?: { name: string } | null;
  mutationType?: { name: string } | null;
  subscriptionType?: { name: string } | null;
  types: IntrospectionType[];
};

export type GraphFieldInfo = {
  name: string;
  typeLabel: string;
  namedType: string;
  namedKind: string;
  description?: string;
  isDeprecated?: boolean;
  args?: Array<{ name: string; typeLabel: string }>;
};

export type GraphTypeInfo = {
  name: string;
  kind: string;
  description?: string;
  fields: GraphFieldInfo[];
  enumValues?: Array<{ name: string; description?: string; isDeprecated?: boolean }>;
  interfaces?: string[];
  possibleTypes?: string[];
  isRoot?: boolean;
};

export type SchemaGraphModel = {
  typesByName: Record<string, GraphTypeInfo>;
  queryRoot?: string;
  mutationRoot?: string;
  truncated: boolean;
  totalTypes: number;
};
