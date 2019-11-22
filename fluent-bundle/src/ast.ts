export type RuntimeMessage = {
  id: string;
  value: RuntimeComplexPattern | null;
  attributes: Record<string, RuntimePattern>;
};

export type RuntimeTerm = {
  id: string;
  value: RuntimeComplexPattern;
  attributes: Record<string, RuntimePattern>;
};

export type RuntimePattern = string | RuntimeComplexPattern;

export type RuntimeComplexPattern = Array<RuntimeElement>;

export type RuntimeElement = string | RuntimeExpression;

export type RuntimeIndent = {
  type: "indent";
  value: string;
  length: number;
};

export type RuntimeExpression =
  | RuntimeSelectExpression
  | RuntimeVariableReference
  | RuntimeTermReference
  | RuntimeMessageReference
  | RuntimeFunctionReference
  | RuntimeLiteral;

export type RuntimeSelectExpression = {
  type: "select";
  selector: RuntimeExpression;
  variants: Array<RuntimeVariant>;
  star: number;
};

export type RuntimeVariableReference = {
  type: "var";
  name: string;
};

export type RuntimeTermReference = {
  type: "term";
  name: string;
  attr: string | null;
  args: Array<RuntimeExpression>;
};

export type RuntimeMessageReference = {
  type: "mesg";
  name: string;
  attr: string | null;
};

export type RuntimeFunctionReference = {
  type: "func";
  name: string;
  args: Array<RuntimeExpression>;
};

export type RuntimeVariant = {
  key: RuntimeLiteral;
  value: RuntimePattern;
};

export type RuntimeNamedArgument = {
  type: "narg";
  name: string;
  value: RuntimeLiteral;
};

export type RuntimeLiteral = RuntimeStringLiteral | RuntimeNumberLiteral;

export type RuntimeStringLiteral = {
  type: "str";
  value: string;
};

export type RuntimeNumberLiteral = {
  type: "num";
  value: number;
  precision: number;
};
