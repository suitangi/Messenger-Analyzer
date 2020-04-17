# Messenger Analyzer

Current Functionality:
- 2019 Messenger Journey
- Data dashboard (In progress)

## Download Data from Facebook
1. Go to https://www.facebook.com/settings?tab=your_facebook_information
2. Click **Download your information**
3. Choose your date range (All is recommended unless you are updating your messenger data)
4. **Select JSON**
5. Select whatever quality of images you want (lower quality images are compressed)
5. Click Deselect All
6. Scroll down and check Messages (*Messages you've exchanged with other people on Messenger*)
7. Wait for Facebook to pack your data (they will email you when it's done).

## Setting up Data
1. Download all of the files (there may be multiple)
2. Unzip them and save them to one directory

For example, it should look something like this (some directories omitted):
```
your_directory_name
├── facebook-username
│   ├── messages
│   │   ├── archived_threads
│   │   ├── inbox
│   │   ├── message_requests
│   │   ├── stickers_used
├── facebook-username (1)
│   ├── messages
├── facebook-username (2)
│   ├── messages
└── ...  
```

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

## Functionality
### Messenger 2019 Journey
A overview of simple data visualizations and numbers for the user's use of Messenger in the year of 2019.
Click 'Load' and load in the directory created in the "Setting up your Data" section.
Use the arrow keys on the keyboard or the clickable arrows on the left side to navigate.

### Data Dashboard
Provides more comprehensive data by two parameters: the contact (can be groups) and a date range.
- Leaving the contact blank would do a data query for all contacts comparison to the user.
- Leaving the date range blank would search for the entire chat history for the contact.
- Leaving both blank would get the default page: the history of all contacts of the user's entire history on messenger.
