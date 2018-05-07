/**
 * @license
 * Angular International Telephone Input Mini
 * http://github.com/fromkeith/ng-intl-tel-min
 * Licensed under the MIT license
 *
 * Uses components from:
 * International Telephone Input v10.0.0
 * https://github.com/jackocnr/intl-tel-input.git
 * Licensed under the MIT license
 */
'use strict';


// Grab the utils from intl-tel-input.
//     // format the given number to the given format
//     function formatNumber(number, countryCode, format)
//     // get an example number for the given country code
//     function getExampleNumber(countryCode, national, numberType)
//     // get the extension from the given number
//     function getExtension(number, countryCode)
//     // get the type of the given number e.g. fixed-line/mobile
//     function getNumberType(number, countryCode)
//     // get more info if the validation has failed e.g. too long/too short
//     function getValidationError(number, countryCode)
//     // check if given number is valid
//     function isValidNumber(number, countryCode)
//     // copied this from i18n.phonenumbers.PhoneNumberFormat in the file https://github.com/googlei18n/libphonenumber/blob/master/javascript/i18n/phonenumbers/phonenumberutil.js
//     var numberFormat
//     // copied this from i18n.phonenumbers.PhoneNumberType in https://github.com/googlei18n/libphonenumber/blob/master/javascript/i18n/phonenumbers/phonenumberutil.js and put the keys in quotes to force closure compiler to preserve the keys
//     var numberType
//     // copied this from i18n.phonenumbers.PhoneNumberUtil.ValidationResult in https://github.com/googlei18n/libphonenumber/blob/master/javascript/i18n/phonenumbers/phonenumberutil.js and again put the keys in quotes.
//     // Also: added NOT_A_NUMBER to match i18n.phonenumbers.Error.NOT_A_NUMBER
//     var validationError

require('intl-tel-input/build/js/utils.js');
const utils = window.intlTelInputUtils;

// include their flag utils
const allCountries = require('./../gen/data.js'); // exports allCountries

let codeToCountry = {};
for (let i = 0; i < allCountries.length; i++) {
    codeToCountry[allCountries[i].iso2] = allCountries[i];
}

// https://en.wikipedia.org/wiki/List_of_North_American_Numbering_Plan_area_codes#Non-geographic_area_codes
const regionlessNanpNumbers = ['800', '822', '833', '844', '855', '866', '877', '880', '881', '882', '883', '884', '885', '886', '887', '888', '889'];


// our work
const angular = require('angular');

const app = angular.module('ng-intl-tel-mini', []);

app.directive('ngIntlTelMini', ['$timeout', function ($timeout) {
    let dialCodeMap = {};
    for (let i = 0; i < allCountries.length; i++) {
        if (!dialCodeMap[allCountries[i].dialCode]) {
            dialCodeMap[allCountries[i].dialCode] = [];
        }
        dialCodeMap[allCountries[i].dialCode][allCountries[i].priority] = allCountries[i].iso2;
    }
    return {
        template: `
<div class="ng-intl-tel-min intl-tel-input allow-dropdown">
    <div class="flag-container">
        <div class="selected-flag" ng-click="toggleSelector()" ng-class="::{'no-click-on-select': turnOffCountryDropdown}">
            <div class="flag iti-flag {{country}}"></div>
            <div class="iti-arrow"></div>
        </div>
        <div class="country-search" ng-show="isCountryListVisible">
            <input ng-if="showSearch" type="text" ng-model="input.searchText"/>
        </div>
        <ul class="country-list" ng-show="isCountryListVisible">
            <li class="country" ng-repeat="c in countries | filter:countryFilter track by c.iso2" ng-class="{active: c.iso2 === country}" ng-click="setCountry(c)">
                <div class="flag-box">
                    <div class="flag iti-flag {{::c.iso2}}"></div>
                </div>
                <span class="country-name">{{::c.name}}</span>
                <span class="dial-code">{{::c.dialCode}}</span>
            </li>
        </ul>
    </div>
    <input type="text" ng-model="phoneText" ng-change="phoneChanged()" placeholder="{{phoneHint}}" />
</div>`,
        scope: {
            isValidCallback: '&onNumberValidityCheck',
            country: '=country',
            showSearch: '@showSearch',
            customCountryFilter: '=countryFilter',
            nationalMode: '@nationalMode',
            turnOffCountryDropdown: '@turnOffCountryDropdown'
        },
        link(scope, element, attr) {
            let countryFilterMap = {};
            let selectedCountryDialCode = '1';
            // based off of ng-intl-min._getDialCode
            // try and extract a valid international dial code from a full telephone number
            // Note: returns the raw string inc plus character and any whitespace/dots etc
            function getDialCode(number) {
                if (!number) {
                    return '';
                }
                // only interested in international numbers (starting with a plus)
                if (number.charAt(0) !== '+') {
                    return '';
                }
                let dialCode = '';
                let numericChars = '';
                // iterate over chars
                for (let i = 1; i < number.length; i++) {
                    let c = number.charAt(i);
                    // if char is number
                    if (!isNaN(parseInt(c)) && String(parseInt(c)) === c) {
                        numericChars += c;
                        // if current numericChars make a valid dial code
                        if (dialCodeMap[numericChars]) {
                            dialCode = numericChars;
                        }
                        // longest dial code is 4 chars
                        if (numericChars.length === 4) {
                            break;
                        }
                    }
                }
                return dialCode;
            }
            // check if the given number is a regionless NANP number (expects the number to contain an international dial code)
            function isRegionlessNanp(number) {
                let numeric = getNumeric(number);
                if (numeric.charAt(0) === '1') {
                    let areaCode = numeric.substr(1, 3);
                    return (regionlessNanpNumbers.indexOf(areaCode) > -1);
                }
                return false;
            }
            function getCountry(dialCode) {
                let countries = dialCodeMap[dialCode];
                if (!countries) {
                    return null;
                }
                for (let i = 0; i < countries.length; i++) {
                    if (countryFilterMap[countries[i]]) {
                        return countries[i];
                    }
                }
                return null;
            }
            // extract the numeric digits from the given string
            function getNumeric(s) {
                if (!s) {
                    return s;
                }
                return s.replace(/\D/g, '');
            }
            function valueChanged() {
                let val = scope.phoneText;
                //detect country change
                if (val && scope.nationalMode && selectedCountryDialCode === '1' && val.charAt(0) !== '+') {
                  if (val.charAt(0) !== '1') {
                    val = '1' + val;
                  }
                  val = '+' + val;
                }
                let dialCode = getDialCode(val),
                    numeric = getNumeric(val),
                    countryCode = null;
                if (!val || val === '+') {
                    countryCode = scope.country;// unchanged
                } else if (dialCode) {
                    let countries = dialCodeMap[dialCode],
                        alreadySelected = (selectedCountryDialCode === dialCode),
                        isNanpAreaCode = (dialCode === '1' && numeric.length >= 4),
                        nanpSelected = (selectedCountryDialCode === '1');

                    if (!(nanpSelected && isRegionlessNanp(numeric)) && (!alreadySelected || isNanpAreaCode)) {
                        // if using onlyCountries option, countryCodes[0] may be empty, so we must find the first non-empty index
                        for (let i = 0; i < countries.length; i++) {
                            if (countryFilterMap[countries[i]]) {
                                countryCode = countries[i];
                                break;
                            }
                        }
                    }
                } else if (val.charAt(0) === '+' && numeric.length > 0) {
                    countryCode = '';
                }
                if (countryCode) {
                    scope.setCountry(codeToCountry[countryCode], true);
                }
                let errorCode = utils.getValidationError(val, scope.country);
                let formatted = utils.formatNumber(val, scope.country, utils.numberFormat.INTERNATIONAL);
                if (errorCode === 0 && scope.customCountryFilter &&
                        formatted.indexOf(' ') > -1 &&
                        getCountry(formatted.substr(1, formatted.indexOf(' ') - 1)) === null) {
                    errorCode = 1;
                }
                $timeout(() => {
                    scope.isValidCallback({
                        $isValid: errorCode === 0,
                        $error: errorCode,
                        $phoneNumber: formatted,
                        $inputVal: val,
                    });
                });
            }

            scope.phoneChanged = function () {
                valueChanged();
            };
            scope.setCountry = function (c, noTrigger) {
                scope.country = c.iso2;
                selectedCountryDialCode = c.dialCode;
                scope.isCountryListVisible = false;
                let example = utils.getExampleNumber(scope.country, 0, utils.numberType.MOBILE);
                scope.phoneHint = example;
                if (!noTrigger) {
                    scope.input.searchText = '';
                    valueChanged();
                }
            };
            scope.toggleSelector = function ($event) {
                if (scope.turnOffCountryDropdown) {
                    return false;
                }
                scope.isCountryListVisible = !scope.isCountryListVisible;
                if ($event) {
                    $event.preventDefault();
                    $event.stopPropogation();
                }
                if (scope.showSearch && scope.isCountryListVisible) {
                    $timeout(() => {
                        element[0].querySelector('.country-search input').focus();
                    }, 10);
                }
                return false;
            };
            scope.countryFilter = function (value, index, array) {
                if (!scope.input.searchText) {
                    return true;
                }
                if (value.name.toLowerCase().indexOf(scope.input.searchText) > -1) {
                    return true;
                }
                return false;
            };
            function windowClicked(e) {
                if (!scope.isCountryListVisible) {
                    return;
                }
                let cur = e.target;
                for (;cur;) {
                    if (cur === element[0]) {
                        return;
                    }
                    cur = cur.parentNode;
                }
                $timeout(() => {
                    scope.isCountryListVisible = false;
                });
            }
            scope.isCountryListVisible = false;
            scope.input = {searchText: ''};
            const applyInitialCountry = () => {
                for (let i = 0; i < scope.countries.length; i++) {
                    if (scope.countries[i].iso2 === scope.country) {
                        scope.setCountry(scope.countries[i]);
                        break;
                    }
                }
            };
            const applyCustomCountiresFilter = () => {
                for (let i = 0; i < scope.customCountryFilter.length; i++) {
                    countryFilterMap[scope.customCountryFilter[i]] = true;
                }
                scope.countries = [];
                for (let i = 0; i < allCountries.length; i++) {
                    if (!countryFilterMap[allCountries[i].iso2]) {
                        continue;
                    }
                    scope.countries.push(allCountries[i]);
                }
            };
            if (scope.customCountryFilter) {
                applyCustomCountiresFilter();
            } else {
                scope.countries = allCountries;
                let lateBind = scope.$watch(() => {
                    return scope.customCountryFilter;
                }, () => {
                    if (!scope.customCountryFilter) {
                        return;
                    }
                    if (lateBind) {
                        lateBind();
                    }
                    applyCustomCountiresFilter();
                    applyInitialCountry();
                });
            }
            applyInitialCountry();
            window.addEventListener('click', windowClicked);
            scope.$on('$destroy', () => {
                window.removeEventListener('click', windowClicked);
            });
            scope.$on('ng-intl-tel-mini.setCountry', (e, countryCode) => {
                scope.setCountry(codeToCountry[countryCode]);
            });
            scope.$on('ng-intl-tel-mini.setNumber', (e, number) => {
                scope.phoneText = number;
                valueChanged();
            });
        }
    };
}]);


module.exports = 'ng-intl-tel-mini';