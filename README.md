# Angular International Telephone Input Mini

A simple Angular 1 directive for Telephone input based off of [intl-tel-input](https://github.com/jackocnr/intl-tel-input), with no jquery.


## How it works
This library pulls in 2 important parts of the [intl-tel-input](https://github.com/jackocnr/intl-tel-input) library.
* src/js/data.js
    * Gives us a list of countries to populate the 'drop down' with
* build/js/utils.js
    * A compiled wrapper around Google's [libphonenumber](http://libphonenumber.googlecode.com/).

These get bundled into this library. We then mimic the layout of an input element from intl-tel-input.

## Why
* I don't want jQuery included in my angular project. Other angular wrappers for [intl-tel-input](https://github.com/jackocnr/intl-tel-input) still require you import jQuery.
* I don't need all the features of intl-tel-input.
* intl-tel-input has done some great work on wrapping libphonenumber and compiling a list of countries + dial codes that doesn't need to be redone.
* Why not go vanilla javascript? Time. But you can help the main project [Remove jQuery Dependencies](https://github.com/jackocnr/intl-tel-input/wiki/Removing-jQuery-Dependency).

## Additions
Adds in a search ability, as navigating that dropdown is very hard.


## Using It
Import it:

```js
    var myApp = angular.module('my-app', [
        require('ng-intl-tel-mini')
    ]);
```


Create the directive:

```html
    <ng-intl-tel-mini on-number-validity-check="isValid($isValid, $error, $phoneNumber)" show-search="true" country="country" />
```

*on-number-validity-check* : Callback for when we perform a validity check. Populates 3 variables
    * $isValid: boolean - true if the number is considered valid.
    * $error: int - the error code for the number
    * $phoneNumber: string - a formated number in the style of INTERNATIONAL

*show-search* : If we should add in the search option to the input.

*country* : The default country we should use. This variable will be updated as the country gets changed.

### Styling
Same as [intl-tel-input](https://github.com/jackocnr/intl-tel-input) except for search:
* _.country-search_ : Div wrapper around search input.

## License
This code: MIT. See [libphonenumber](http://libphonenumber.googlecode.com/) and [intl-tel-input](https://github.com/jackocnr/intl-tel-input) for their licenses.