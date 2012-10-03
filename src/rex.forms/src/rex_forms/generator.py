

class JsonError(Exception):
    
    def __init__(self, message):
        self.message = message

    def __str__(self):
        return self.message


class Form(object):

    def process_item(self, json):
        if json['type'] == 'group':
            for page in json['pages']:
                self.process_item(page)
        elif json['type'] == 'page':
            pg = Page(json)
            self.pages.append(pg)
            for question in pg.questions:
                self.questions[question.name] = question


    def __init__(self, json, code):
        self.code = code
        self.pages = []
        self.questions = {}

        if 'pages' in json:
            for page in json['pages']:
                self.process_item(page)


class Page(object):

    def __init__(self, json):
        self.skipif = json['skipIf']
        self.type = json['type']
#        self.id = json['id']
        self.steps = []
        self.questions = []
        for question in json['questions']:
            self.questions.append(Question(question))


class Question(object):

    def __init__(self, json):
        self.question_type = json['type']
        self.name = json['name'].encode("utf-8")
        self.title = json['title'].encode("utf-8")
#        self.hint = json['hint'].encode("utf-8")
        self.answers = []
        self.answers_lookup = {}
        self.mandatory = json['required']
#        self.disableIf = json['disableIf']
#        self.constraints = json['constraints']
        if 'answers' in json:
            for answer in json['answers']:
                answ = Answer(answer)
                self.answers.append(answ)
                self.answers_lookup[answ.code] = answ

    def isEqual(self, question):
        #question should exist
        if not question:
            return False
        #names should be same
        if self.name != question.name:
            return False
        #types should be same
        if self.question_type != question.question_type:
            return False
        #answers should be same
        for my_answer in self.answers:
            other_answer = question.answers_lookup.get(my_answer.code)
            #codes can't be changed
            if not my_answer.isEqual(other_answer):
                return False
        return True
        

class Answer(object):

    def __init__(self, json):
#        self.userInput = json['userInput']
        self.code = json['code'].encode("utf-8")
#        self.score = json['score']
        self.title = json['title'].encode("utf-8")

    def isEqual(self, answer):
        #Answers can't be added
        if not answer:
            return False
        return self.code == answer.code
