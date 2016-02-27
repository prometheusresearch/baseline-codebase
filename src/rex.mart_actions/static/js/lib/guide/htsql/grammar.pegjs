/**
 * @copyright 2015, Prometheus Research, LLC
 */

{

var AST = require('./AST');

}

start
  = _ expression:Expression _ {
      return expression;
    }

Expression "expression"
  = Collection
  / Record

Collection
  = "/" name:Identifier refine:RefineChain {
      return new AST.Collection(name, refine);
    }

Refine
  = Projection
  / MethodCall

RefineChain
  = chain:(_ Refine)* {
    return chain.map(function(item) { return item[1]; });
  }

MethodCall "method call"
  = "." _ name:Identifier _ "(" args:[^)]* ")" {
    return new AST.MethodCall(name, args.join(''));
  }

Projection "projection"
  = "{" _ first:ProjectionItem rest:ProjectionItemSeq* _ "}" {
      return new AST.Projection([first].concat(rest));
    }
  / "{" "}"

ProjectionItemSeq
  = _ "," _ projectionItem:ProjectionItem _ {
      return projectionItem;
    }

ProjectionItemImpl
  = Collection
  / Record
  / Field

ProjectionItem
  = projection:ProjectionItemImpl alias:Alias? {
      return alias ? new AST.Alias(projection, alias) : projection;
    }

StringLiteral "string"
  = "'" value:[^']+ "'" {
      return value.join('')
    }

Alias "alias"
  = _ ":as" _ alias:StringLiteral {
       return alias;
    }

Record "record"
  = name:Identifier _ projection:Projection {
      return new AST.Record(name, projection);
    }

Field "field"
  = field:PropertyAccessSeq {
      return new AST.Field(field.join('.'));
    }

Identifier "identifier"
  = identifier:[a-zA-Z_]+ {
      return identifier.join('');
    }

PropertyAccess "property access"
  = "." identifier:Identifier {
      return identifier;
    }

PropertyAccessSeq
  = first:Identifier rest:(PropertyAccess)* {
      return [].concat(first).concat(rest);
    }

Whitespace
  = " "
  / "\t"
  / "\n"

_
  = Whitespace*
