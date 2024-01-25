import { Component, OnInit, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { map, Observable } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

//Adding comment
export class AppComponent implements OnInit {
  @ViewChild("commentBox") commentBox: any;
  userControl = new FormControl('');
  comments: Comment[] = [];
  filteredUsers!: Observable<User[]>;
  private users: User[] = [];
  private caretPosition!: number;
  private currentText!: string;
  private isSpacePressed: boolean = false;
  private currentFilter: User[] = [];

  constructor() {
    //Detect and handle changes in comments field
    this.filteredUsers = this.userControl.valueChanges.pipe(
      map(text => this._filterUsers(text)),
    );
  }

  ngOnInit(): void {
    //Load in static data
    this.loadComments();
    this.loadUsers();
  }

  //Main filter for mentions functionality
  private _filterUsers(value: string | null): User[] {
    if (value) {
      //Update caret position to ensure accuracy of scanning
      this.getCaretPosition(this.commentBox.nativeElement);
      //Update and store the new text that was entered
      this.currentText = value;

      //For the scan to work properly we want to ignore the incoming space
      if (this.isSpacePressed) {
        this.caretPosition = this.caretPosition - 1;
      }

      //Scan for the active mention
      let mention = this.scanForMentions(value, this.caretPosition - 1);
      if (mention != "") {
        //Remove the @ from the string
        let filterValue = mention.substring(1).toLowerCase();

        //First check to see if we have any exact matches following a space press
        let equals = this.users.filter(user => user.name.toLowerCase() == filterValue || user.handle.toLowerCase() == filterValue);
        //If there is only one option from the filter following a space press we can set the value
        if (equals && equals.length == 1 && this.isSpacePressed) {
          this.optionSelected(equals[0], true);
          this.currentFilter = [];
          return [];
        }

        //If nothing was an exact match, check for matches using includes
        let filtered = this.users.filter(user => user.name.toLowerCase().includes(filterValue) || user.handle.toLowerCase().includes(filterValue));

        //In this case we can set the value because there is only one option, simplify things for the user
        //The check for the caret position + 1 is so that if a user goes to edit a current mention, we don't add
        //the mention again if they press space in the middle of it.
        if (filtered && filtered.length == 1 && this.isSpacePressed && (this.currentText.at(this.caretPosition + 1) == " " ||
          this.currentText.at(this.caretPosition + 1) == undefined)) {
          this.optionSelected(filtered[0], true);
          this.currentFilter = [];
          return [];
        } else {
          this.currentFilter = filtered;
          return filtered;
        }
      } else {
        this.currentFilter = [];
        return [];
      }
    } else {
      this.currentFilter = [];
      return [];
    }
  }

  private scanForMentions(value: string | null, index: number) {
    if (value) {
      //Search backwards for the @ character, if we have objects currently in the filter, we know that we're in the midst of a search
      //and can let the mention match proceed
      while (index >= 0 && (value.at(index) != " " || this.currentFilter.length != 0)) {
        if (value.at(index) == '@') {
          break;
        }
        index--;
      }
      let startIndex = index;

      // handling email
      if (index - 1 >= 0) {
        // can expand this reg ex as needed for certain characters
        const charRegEx = /\w|\.|-/;
        let foundChar = value.at(index - 1)?.match(charRegEx);
        if (foundChar != null) {
          return "";
        }
      }

      if (startIndex >= 0 && value.at(startIndex) == '@') {
        //First set the end index to the first space to ignore other text that might not be part of the current mention
        let endIndex = value.indexOf(" ", startIndex);

        if (endIndex == -1) { //This case is when we're at the end of the current string object
          endIndex = value.length;
        } else if (this.caretPosition > endIndex) { //The caret might be past the space in the case of a first and last name.
          endIndex = this.caretPosition;            //In that case we still need to check for a match so we move the end index to the caret.
        }
        return value.substring(startIndex, endIndex);
      }
    }
    return "";
  }

  private loadComments() {
    let comment = new Comment("Hello", "Ornate Hamster", "7/6/2023, 11:45:15 PM");
    let commentTwo = new Comment("Wow, incredible, ornate hamster in my comment section", "Charles", "7/6/2023, 11:50:30 PM");

    this.comments.push(comment);
    this.comments.push(commentTwo);
  }

  private loadUsers() {
    let hulk = new User(12345, "Hulk Hogan", "assets/Hulk_Hogan.jpg", "Hulkster");
    let randy = new User(20343, 'Randy Savage', "assets/Randy_Savage.jpg", "MachoKing");
    let warrior = new User(34398, "Ultimate Warrior", "assets/warrior.jpg", "PartUnknown");
    let snake = new User(44933, "Jake Roberts", "assets/Jake-Roberts.jpg", "TheSnake");
    let warriors = new User(44934, "Ultimate Warriors", "assets/The_Ultimate_Warrior.jpg", "PartsUnknown");

    this.users.push(hulk);
    this.users.push(randy);
    this.users.push(warrior);
    this.users.push(snake);
    this.users.push(warriors);
  }

  addComment(text: string) {
    if (text != null && text.trim() !== "") {
      let newDate: Date = new Date();
      let comment = new Comment(text, "Charles", newDate.toLocaleString("en-US"));
      // find all the mentions in the current comment text
      let mentionArray = this.findAllMentions(text);
      for (let mention of mentionArray) {
        let user: User | undefined = this.findUser(mention);
        if (user) {
          this.alertUser(user);
        }
      }

      this.comments.push(comment);
    }
    this.userControl.setValue("");
  }

  //This function will add the selected mention to the current text in the comment section
  optionSelected(selectedUser: User, fromSpacePress?: boolean) {
    let index = this.caretPosition;
    let textToAdd = selectedUser.handle;

    //Search backwards from the caret position for the mention character @ 
    while (this.currentText.at(index) != '@' && index >= 0) {
      index--;
    }
    let startIndex = index;
    //The beginning should represent everything before and including the active @ character 
    let beginning = this.currentText.substring(0, startIndex + 1);

    //The ending will be all the text following the selected mention handle
    let ending;
    if (this.currentText.substring(this.caretPosition) == "") {
      //This is here so we don't add an extra space after a space press
      if (fromSpacePress) {
        ending = "";
      } else {
        ending = " ";
      }
    } else {
      let spaceIndex = this.caretPosition;
      while (this.currentText.at(spaceIndex) != " " && spaceIndex < this.currentText.length) {
        spaceIndex++;
      }
      //Get the characters from the first space following the mention handle to the end of the current comment
      ending = this.currentText.substring(spaceIndex);
    }

    let result = beginning + textToAdd + ending;

    //We don't want to trigger an endless loop here since the filter calls this optionSelected function
    let options = { emitEvent: false };
    this.userControl.setValue(result, options);
  }

  //Function to alert the selected user in some capacity
  private alertUser(user: User) {
    alert(user.name);
  }

  //Get the current position of the caret/cursor from the input field
  getCaretPosition(input: any, fromClick?: boolean) {
    if (input.selectionEnd == input.selectionStart) {
      this.caretPosition = input.selectionStart;
      if (fromClick) {
        //If we invoked this via a click in the input field we want to check whether we should display selectable users for mentions
        //This will trigger a valueChanges event which is being listened for 
        this.userControl.updateValueAndValidity({ onlySelf: false, emitEvent: true });
      }
    }
  }

  //Use this function purely to determine if the space bar was pressed
  //Since it is a keydown it will get invoked before the valueChanges event
  keyPress(event: any) {
    if (event && event.code == "Space") {
      this.isSpacePressed = true;
    } else {
      this.isSpacePressed = false;
    }
  }

  private findAllMentions(text: string): string[] {
    const mentionRegex = /(?<=\s)@\w+|^@\w+/gm;
    let mentionsArray: string[] = [];

    if (text) {
      let matches = text.matchAll(mentionRegex);
      if (matches) {
        for (let match of matches) {
          let matchValue: string | undefined = match.at(0);
          if (matchValue) {
            mentionsArray.push(matchValue);
          }
        }
      }
    }
    return mentionsArray;
  }

  private findUser(handle: string): User | undefined {
    let handleToFind = handle.substring(1).toLowerCase();
    return this.users.find(user => user.handle.toLowerCase() == handleToFind);
  }
}

//Class Definitions
export class Comment {
  content: string;
  user: string;
  time: string;

  constructor(content: string,
    user: string,
    time: string) {
    this.content = content;
    this.user = user;
    this.time = time;
  }
}

export class User {
  userID: number;
  name: string;
  photo: string;
  handle: string;

  constructor(userID: number,
    name: string,
    photo: string,
    handle: string) {
    this.userID = userID;
    this.name = name;
    this.photo = photo;
    this.handle = handle;
  }
}
