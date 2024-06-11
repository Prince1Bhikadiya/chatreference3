
import nltk
from nltk.stem import WordNetLemmatizer
lemmatizer = WordNetLemmatizer()
import pickle
import numpy as np
from keras.models import load_model
import json
import random

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # This allows any origin to access your API. Be cautious in production.

# Load model and data
model = load_model('./model/chatassistant_model.h5')
intents = json.loads(open('./model/intents.json').read())
words = pickle.load(open('./model/words.pkl', 'rb'))
classes = pickle.load(open('./model/classes.pkl', 'rb'))

def clean_up_sentence(sentence):
    sentence_words = nltk.word_tokenize(sentence)
    sentence_words = [lemmatizer.lemmatize(word.lower()) for word in sentence_words]
    return sentence_words

def bow(sentence, words, show_details=True):
    sentence_words = clean_up_sentence(sentence)
    bag = [0] * len(words)
    for s in sentence_words:
        for i, w in enumerate(words):
            if w == s:
                bag[i] = 1
                if show_details:
                    print("found in bag: %s" % w)
    return np.array(bag)

def predict_class(sentence, model):
    p = bow(sentence, words, show_details=False)
    res = model.predict(np.array([p]))[0]
    ERROR_THRESHOLD = 0.25
    results = [[i, r] for i, r in enumerate(res) if r > ERROR_THRESHOLD]
    results.sort(key=lambda x: x[1], reverse=True)
    return_list = []
    for r in results:
        return_list.append({"intent": classes[r[0]], "probability": str(r[1])})
    return return_list

def getResponse(ints, intents_json):
    tag = ints[0]['intent']
    list_of_intents = intents_json['intents']
    for i in list_of_intents:
        if i['tag'] == tag:
            result = random.choice(i['responses'])
            break
    return result

def chatbot_response(msg):
    ints = predict_class(msg, model)
    res = getResponse(ints, intents)
    return res


@app.route('/')
def serve_frontend():
    return send_from_directory('frontend', 'base.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('frontend', path)



@app.route('/predict', methods=['POST'])
def chat():
    data = request.get_json()
    msg = data.get('message', '')
    if msg:
        response = chatbot_response(msg)
        return jsonify({'response': response})
    else:
        return jsonify({'error': 'No message provided'}), 400

if __name__ == '__main__':
    app.run(port=8080)