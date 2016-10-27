{
  "id": "urn:demo-qctest-form",
  "version": "1.5",
  "title": "Demo QC Test Form",
  "meta": {
    "generator": "RexDBFormBuilder/5"
  },
  "record": [
    {
      "id": "integer",
      "type": "integer"
    },
    {
      "id": "float",
      "type": {
        "base": "float",
        "range": {
          "min": -10.5,
          "max": 5.2
        }
      }
    },
    {
      "id": "text1",
      "type": {
        "base": "text",
        "length": {
          "min": 3,
          "max": 12
        }
      },
      "identifiable": true
    },
    {
      "id": "text5",
      "type": {
        "base": "text",
        "pattern": "^[a-z]+$"
      }
    },
    {
      "id": "enumeration3",
      "type": {
        "base": "enumeration",
        "enumerations": {
          "baby-pink": {},
          "black": {},
          "blue": {},
          "bright-yellow": {},
          "cream": {},
          "dark-red": {},
          "pink": {},
          "purple": {},
          "red": {},
          "royal-blue": {},
          "white": {},
          "yellow": {}
        }
      }
    },
    {
      "id": "boolean",
      "type": "boolean",
      "required": true
    },
    {
      "id": "date1",
      "type": {
        "base": "date",
        "range": {
          "min": "2016-01-01",
          "max": "2016-12-01"
        }
      }
    },
    {
      "id": "time",
      "type": "time"
    },
    {
      "id": "datetime",
      "type": "dateTime"
    },
    {
      "id": "enumeration1",
      "type": {
        "base": "enumeration",
        "enumerations": {
          "option-1": {},
          "option-2": {},
          "option-3": {},
          "option-4": {}
        }
      }
    },
    {
      "id": "enumeration2",
      "type": {
        "base": "enumeration",
        "enumerations": {
          "no": {},
          "yes": {}
        }
      }
    },
    {
      "id": "boolean_dropdown",
      "type": "boolean"
    },
    {
      "id": "another_text",
      "type": "text"
    },
    {
      "id": "enumerationset1",
      "type": {
        "base": "enumerationSet",
        "length": {
          "min": 2,
          "max": 5
        },
        "enumerations": {
          "arabic": {},
          "english": {},
          "hindi": {},
          "mandarin": {},
          "russian": {},
          "spanish": {}
        }
      },
      "required": true
    },
    {
      "id": "boolean2",
      "type": "boolean"
    },
    {
      "id": "enumerationset2",
      "type": {
        "base": "enumerationSet",
        "enumerations": {
          "cat": {},
          "dog": {},
          "hamster": {},
          "rabbit": {}
        }
      }
    },
    {
      "id": "breed",
      "type": "text"
    },
    {
      "id": "recordlist",
      "type": {
        "base": "recordList",
        "record": [
          {
            "id": "text2",
            "type": "text"
          },
          {
            "id": "enumeration",
            "type": {
              "base": "enumeration",
              "enumerations": {
                "choice-a": {},
                "choice-b": {},
                "choice-c": {},
                "choice-d": {}
              }
            },
            "required": true
          },
          {
            "id": "enumerationset3",
            "type": {
              "base": "enumerationSet",
              "enumerations": {
                "five": {},
                "four": {},
                "one": {},
                "six": {},
                "three": {},
                "two": {}
              }
            }
          }
        ]
      }
    },
    {
      "id": "text4",
      "type": "text"
    },
    {
      "id": "matrix",
      "type": {
        "base": "matrix",
        "columns": [
          {
            "id": "text3",
            "type": "text",
            "required": true
          },
          {
            "id": "integer2",
            "type": {
              "base": "integer",
              "range": {
                "min": 10
              }
            }
          }
        ],
        "rows": [
          {
            "id": "first",
            "required": true
          },
          {
            "id": "second"
          },
          {
            "id": "third"
          }
        ]
      }
    },
    {
      "id": "text11",
      "type": "text"
    },
    {
      "id": "boolean_fail",
      "type": "boolean"
    },
    {
      "id": "lookup_text",
      "type": "text"
    },
    {
      "id": "enumeration5",
      "type": {
        "base": "enumeration",
        "enumerations": {
          "first": {},
          "second": {},
          "third": {}
        }
      }
    },
    {
      "id": "enumeration6",
      "type": {
        "base": "enumeration",
        "enumerations": {
          "five": {},
          "four": {},
          "six": {}
        }
      }
    },
    {
      "id": "boolean3",
      "type": "boolean"
    },
    {
      "id": "recordlist2",
      "type": {
        "base": "recordList",
        "record": [
          {
            "id": "boolean4",
            "type": "boolean"
          },
          {
            "id": "enumeration4",
            "type": {
              "base": "enumeration",
              "enumerations": {
                "blue": {},
                "red": {},
                "white": {}
              }
            },
            "required": true
          },
          {
            "id": "enumerationset4",
            "type": {
              "base": "enumerationSet",
              "enumerations": {
                "orange": {},
                "peach": {},
                "yellow": {}
              }
            }
          }
        ]
      }
    },
    {
      "id": "q_boolean1",
      "type": "boolean"
    },
    {
      "id": "q_matrix1",
      "type": {
        "base": "matrix",
        "columns": [
          {
            "id": "q_mtx_text",
            "type": "text"
          },
          {
            "id": "q_mtx_integer",
            "type": "integer"
          },
          {
            "id": "q_mtx_float",
            "type": "float"
          }
        ],
        "rows": [
          {
            "id": "first1"
          },
          {
            "id": "second1"
          }
        ]
      }
    },
    {
      "id": "q_boolean2",
      "type": "boolean"
    },
    {
      "id": "q_matrix2",
      "type": {
        "base": "matrix",
        "columns": [
          {
            "id": "q_mtx2_text",
            "type": "text"
          },
          {
            "id": "q_mtx2_integer",
            "type": "integer"
          },
          {
            "id": "q_mtx2_enumeration",
            "type": {
              "base": "enumeration",
              "enumerations": {
                "blue": {},
                "green": {},
                "red": {}
              }
            }
          }
        ],
        "rows": [
          {
            "id": "alpha"
          },
          {
            "id": "beta"
          }
        ]
      }
    },
    {
      "id": "enumerationset5",
      "type": {
        "base": "enumerationSet",
        "enumerations": {
          "france": {},
          "italy": {},
          "other": {},
          "switzerland": {}
        }
      }
    },
    {
      "id": "recordlist3",
      "type": {
        "base": "recordList",
        "record": [
          {
            "id": "date3",
            "type": "date"
          },
          {
            "id": "date4",
            "type": "date"
          }
        ]
      }
    },
    {
      "id": "recordlist4",
      "type": {
        "base": "recordList",
        "record": [
          {
            "id": "date5",
            "type": "date"
          },
          {
            "id": "date6",
            "type": "date"
          }
        ]
      }
    },
    {
      "id": "recordlist5",
      "type": {
        "base": "recordList",
        "record": [
          {
            "id": "date7",
            "type": "date"
          },
          {
            "id": "date8",
            "type": "date"
          }
        ]
      }
    },
    {
      "id": "text12",
      "type": "text"
    }
  ]
}
