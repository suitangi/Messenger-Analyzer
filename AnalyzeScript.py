
import codecs
types_of_encoding = ["utf8", "cp1252"]
for encoding_type in types_of_encoding:
    with codecs.open("message_1.html", encoding = encoding_type, errors ='replace') as file:
        data = file.read().replace('\n', '')
        
print("Total Messages: " + str(data.count("_3-96 _2let")))

namelist = [] # Add dead members here
part = data.find("Participants:")

#group chats
if part > 0:
    names = data[part + 14: part + data[data.find(">Participants:"):].find("<") - 1]
    names = names.replace(" and ", ", ")
    namelist.extend(names.split(", "))
#DM's
else:
    title = data.find('title>')
    title = data[title + 6: title + data[data.find("title>"):].find("<")]
    namelist = [title]
    r = 0
    while(len(namelist) == 1):
        r = data[r:].find("_3-96 _2pio _2lek _2lel\">")
        name = data[r + 25: r +data[r:].find("<")]
        if(name != namelist[0]):
            namelist.append(name)
        r += 1
            
        

months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
dates = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]


#get the dates for the beginning and end
r = data.rfind("_3-94 _2lem\">")
drString = data[r + 13: r +data[r:].find("<")]
com = drString.find(", ")
drString = drString[:com + drString[com + 1:].find(", ") + 1]
print("Start From: " + drString)
for i, mon in enumerate(months):
    if not i == 0:
        drString = drString.replace(mon, str(i))

drString = drString.replace(",", "").replace("to ", "")
numdate = drString.split(" ")

m = int(numdate[0])
d = int(numdate[1])
y = int(numdate[2])

r = data.find("_3-94 _2lem\">")
r = r + data[r + 1:].find("_3-94 _2lem\">")
drString = data[r + 13: r +data[r:].find("<")]
com = drString.find(", ")
drString = drString[1:com + drString[com + 1:].find(", ") + 1]
print("Ends On: " + drString)
for i, mon in enumerate(months):
    if not i == 0:
        drString = drString.replace(mon, str(i))

drString = drString.replace(",", "").replace("to ", "")
numdate = drString.split(" ")

m1 = int(numdate[0])
d1 = int(numdate[1])
y1 = int(numdate[2])

for name in namelist:
    print(name + ": " + str(data.count(">" + name + "<")))
    
def date(y, m, d):
    return months[m] + " " + str(d) + ", " + str(y)

#go through the file and analyze
date_old = date(y, m, d)
date_new = date(y, m, d + 1)
start = data[0:].rfind(date_old)
stop = data[:start].rfind(date_new)
tmp = ["Date"]
tmp.extend(namelist)
tmp.append("Total Messages")
date_result = [tmp]
temp_old = ""
initialFlag = True
while(not(y == y1 and m == m1 and d == d1)):
    stop = data[:start].rfind(date_new)
    if stop == -1 and initialFlag:
        date_old = date_new
    elif stop == -1 and not initialFlag:
        print("No messages on: " + date_new)
        tmp = [date_new]
        tmp.extend([0] * (len(namelist) + 1))
        date_result.append(tmp)
        if len(temp_old)==0:
             temp_old = date_old        
    else:
        if initialFlag:
            initialFlag = False
            print("Conversation Started at: " +  date_new)
            tmp = [date_old]
            tmp.extend([0] * (len(namelist) + 1))
            date_result.append(tmp)
        else:
            if len(temp_old)!=0:
                tmp = [temp_old]
                temp_old = ""
            else:
                tmp = [date_old]
            for name in namelist:
                tmp.append(data[stop:start].count(">" + name + "<"))
            tmp.append(data[stop:start].count("_3-96 _2let"))
            date_result.append(tmp)
            start = stop
    date_old = date_new

    d += 1
    if d > dates[m]:
        if not (y % 4 == 0 and m == 2 and d == 29):
            d = 1
            m += 1
            if m < 12:
                print(date(y, m, d))
    if m > 12:
        m = 1
        y += 1
        print(date(y, m, d))
        
    date_new = date(y, m, d)

#Save the csv file
filename = "Data_output.csv"
f = open(filename, "w+")
f.close()
with open(filename,"w+") as my_csv:
    csvWriter = csv.writer(my_csv,delimiter=',',lineterminator = '\n')
    csvWriter.writerows(date_result)