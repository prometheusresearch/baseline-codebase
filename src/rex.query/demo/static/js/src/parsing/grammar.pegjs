{

function reduceBinaryOp(head, tail) {
  return tail.reduce(
    (left, [_0, operator, _2, right]) =>
      ({type: 'BinaryOperation', left, operator, right}),
    head);
}

}

Expression
  = Binding
  / Logical

Binding
  = name:Identifier _ ":=" _ expression:Comparison {
    return {type: 'Binding', name: name.value, expression};
  }

Logical
  = head:Comparison tail:(_ ("|" / "&") _ Comparison)* {
      return reduceBinaryOp(head, tail);
    }

Comparison
  = head:Addition tail:(_ (">=" / ">" / "<=" / "<" / "==" / "!=") _ Addition)* {
      return reduceBinaryOp(head, tail);
    }

Addition
  = head:Term tail:(_ ("+" / "-") _ Term)* {
      return reduceBinaryOp(head, tail);
    }

Term
  = head:Pipeline tail:(_ ("*" / "/") _ Pipeline)* {
      return reduceBinaryOp(head, tail);
    }

Pipeline
  = head:Composition tail:(_ (":") _ (Apply / Identifier))* {
      return reduceBinaryOp(head, tail);
    }

Composition
  = head:Factor tail:(_ (".") _ Factor)* {
      return reduceBinaryOp(head, tail);
    }

Factor
  = "(" _ expr:Expression _ ")" { return expr; }
  / UnaryOp
  / Apply
  / IntegerLiteral
  / StringLiteral
  / BooleanLiteral
  / Identifier

UnaryOp
  = operator:("!" / "-") _ expression:Factor {
    return {type: 'UnaryOperation', operator, expression};
  }

Apply "function application"
  = name:Identifier "(" _ argList:ArgList? _ ")" {
    return {
      type: 'Application',
      name: name.value,
      argList: argList || []
    };
  }

ArgList "argument list"
  = head:Expression tail:(_ (",") _ Expression)* {
    return [head].concat(tail.map(item => item[3]));
  }

Identifier "identifier"
  = [a-zA-Z_]+ {
    return {type: 'Identifier', value: text()};
  }

IntegerLiteral "integer"
  = [0-9]+ {
    return {type: 'IntegerLiteral', value: parseInt(text(), 10)};
  }

BooleanLiteral "boolean"
  = value:("true" / "false") {
    return {type: 'BooleanLiteral', value: text() === 'true'}
  }

StringLiteral "string"
  = quotation_mark chars:char* quotation_mark {
    return {type: 'StringLiteral', value: chars.join("")};
  }

char
  = unescaped
  / escape
    sequence:(
        '"'
      / "\\"
      / "/"
      / "b" { return "\b"; }
      / "f" { return "\f"; }
      / "n" { return "\n"; }
      / "r" { return "\r"; }
      / "t" { return "\t"; }
      / "u" digits:$(HEXDIG HEXDIG HEXDIG HEXDIG) {
          return String.fromCharCode(parseInt(digits, 16));
        }
    )
    { return sequence; }

escape
  = "\\"

quotation_mark
  = '"'

unescaped
  = [^\0-\x1F\x22\x5C]

_ "whitespace"
  = [ \t\n\r]*

DIGIT
  = [0-9]

HEXDIG
  = [0-9a-f]i
