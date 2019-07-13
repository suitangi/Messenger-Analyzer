

import codecs
types_of_encoding = ["utf8", "cp1252"]
for encoding_type in types_of_encoding:
    with codecs.open("message_1.html", encoding = encoding_type, errors ='replace') as file:
        data = file.read().replace('\n', '')
        
clearlist = ["<head>", "</head>", "<html>", "</html>", "<div>", "</div>", 
             "<div class=\"pam _3-95 _2pi0 _2lej uiBoxWhite noborder\">", "<body>", "</body>"]

data2 = data

for word in clearlist:
    data2 = data2.replace(word, "")
    
    
first_str = "<div class=\"_3-96 _2pio _2lek _2lel\">"
data2 = data2[data2.find(first_str) + len(first_str):]

commalist = ["<div class=\"_3-96 _2let\">", "<div class=\"_3-94 _2lem\">"]

for word in commalist:
    data2 = data2.replace(word, ", ")
    
data2 = data2.replace("<div class=\"_3-96 _2pio _2lek _2lel\">", "\n")
data2 = data2.replace("&#039;", "'")

data2 = data2[:data2.rfind("<div class=\"_4t5o\">")]

taglist = [["<video src", "</video>", "video"], 
           ["<a href=\"", "</a>", "link"], 
           ["<img alt=\"", "/>", "image"]]

for t in taglist:
    r = 1
    i = 1000000
    start = t[0]
    stop = t[1]
    name = t[2]
    offset = len(stop)
    print("----------------- " + name + " started -------------------")
    while r > 0:
        r = data2.find(start)
        if(r > i):
            i += 1000000
            print(r)
        if(r > 0):
            r1 = data2[r:].find(stop)
            data2 = data2[:r] + "//" + name + "//" + data2[r + r1 + offset:]
        
    print("----------------- " + name + " done -------------------")




