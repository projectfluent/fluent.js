export type Message = {
  id: string;
  value: Pattern | null;
  attributes: Record<string, Pattern>;
};

export type Term = {
  id: string;
  value: Pattern;
  attributes: Record<string, Pattern>;
};

export type Pattern = string | ComplexPattern;

export type ComplexPattern = Array<PatternElement>;

export type PatternElement = string | Expression;

export type Indent = {
  type: "indent";
  value: string;
  length: number;
};

export type Expression =
  | SelectExpression
  | VariableReference
  | TermReference
  | MessageReference
  | FunctionReference
  | Literal;

export type SelectExpression = {
  type: "select";
  selector: Expression;
  variants: Array<Variant>;
  star: number;
};

export type VariableReference = {
  type: "var";
  name: string;
};

export type TermReference = {
  type: "term";
  name: string;
  attr: string | null;
  args: Array<Expression | NamedArgument>;
};

export type MessageReference = {
  type: "mesg";
  name: string;
  attr: string | null;
};

export type FunctionReference = {
  type: "func";
  name: string;
  args: Array<Expression | NamedArgument>;
};

export type Variant = {
  key: Literal;
  value: Pattern;
};

export type NamedArgument = {
  type: "narg";
  name: string;
  value: Literal;
};

export type Literal = StringLiteral | NumberLiteral;

export type StringLiteral = {
  type: "str";
  value: string;
};

export type NumberLiteral = {
  type: "num";
  value: number;
  precision: number;
};
