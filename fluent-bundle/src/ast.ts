export type RuntimeMessage =
  | {
      id: string;
      value: RuntimePattern;
      attributes: Record<string, RuntimeValue>;
    }
  | {
      id: string;
      value: RuntimeValue;
      attributes: null;
    }
  | {
      id: string;
      value: null;
      attributes: Record<string, RuntimeValue>;
    };

export type RuntimeValue = string | RuntimePattern;

export type RuntimePattern = Array<RuntimeElement>;

export type RuntimeElement = string | RuntimeExpression;

export type RuntimeIndent = {
  type: "indent";
  value: string;
  length: number;
};

export type RuntimeExpression =
  | RuntimeSelectExpression
  | RuntimeInlineExpression;

export type RuntimeSelectExpression = {
  type: "select";
  selector: RuntimeInlineExpression;
  variants: Array<any>;
  star: number;
};

export type RuntimeInlineExpression =
  | RuntimeVariableReference
  | RuntimeTermReference
  | RuntimeMessageReference
  | RuntimeFunctionReference
  | RuntimeLiteral;

export type RuntimeVariableReference = {
  type: "var";
  name: string;
};

export type RuntimeTermReference = {
  type: "term";
  name: string;
  attr: any;
  args: any;
};

export type RuntimeMessageReference = {
  type: "mesg";
  name: string;
  attr: any;
};

export type RuntimeFunctionReference = {
  type: "func";
  name: string;
  args: any;
};

export type RuntimeVariant = {
  key: RuntimeLiteral;
  value: RuntimeValue;
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
