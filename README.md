# Messenger Analyzer
Current Functionality:
- Yearly Messenger Journey
- Data dashboard

Future Functionality:
- Message Query
- Media Browser
- Conversation Viewer

## Downloading Data from Facebook
See [here](https://suitangi.github.io/Messenger-Analyzer/DownloadData).

## Usage
Clone this repository,
```
git clone https://github.com/suitangi/Messenger-Analyzer.git
```
then install this project
```
npm install
```
then run it
```
npm start
```
![Main Menu](https://raw.githubusercontent.com/suitangi/Messenger-Analyzer/master/docs/img/Main.png)
![Main Menu](https://raw.githubusercontent.com/suitangi/Messenger-Analyzer/master/docs/img/MainMenu.png)

## Functionality
### Messenger Yearly Journey

A overview of simple data visualizations and numbers for the user's use of Messenger in the chosen year.
Use the arrow keys on the keyboard or the clickable arrows on the left side to navigate.

### Data Dashboard
Provides more comprehensive data by two parameters: the contact (can be groups) and a date range.
- Leaving the contact blank would do a data query for all contacts comparison to the user.
- Leaving the date range blank would search for the entire chat history for the contact.
- Leaving both blank would get the default page: the history of all contacts of the user's entire history on messenger.

## Disclaimer
The code is not pretty, but it works. There are a number of things that probably should be more optimized, that will come as I finish more functionalities.

## Dependencies
See [Dependencies](https://github.com/suitangi/Messenger-Analyzer/network/dependencies)
