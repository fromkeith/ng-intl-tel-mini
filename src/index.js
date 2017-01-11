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
        <div class="selected-flag" ng-click="toggleSelector()">
            <div class="flag iti-flag {{country}}"></div>
            <div class="iti-arrow"></div>
        </div>
        <div class="country-search" ng-show="isCountryListVisible">
            <input ng-if="showSearch" type="text" ng-model="input.searchText"/>
        </div>
        <ul class="country-list" ng-show="isCountryListVisible">
            <li class="country" ng-repeat="c in countries | filter:countryFilter" ng-class="{active: c.iso2 === country}" ng-click="setCountry(c)">
                <div class="flag-box">
                    <div class="flag iti-flag {{c.iso2}}"></div>
                </div>
                <span class="country-name">{{c.name}}</span>
                <span class="dial-code">{{c.dialCode}}</span>
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
        },
        link(scope, element, attr) {
            let countryFilterMap = {};
            function findBestCountryMatch(dialCode) {
                let countries = dialCodeMap[dialCode];
                if (!countries) {
                    return scope.country;
                }
                for (let i = 0; i < countries.length; i++) {
                    if (scope.country !== countries[i]) {
                        continue;
                    }
                    if (countryFilterMap[countries[i]]) {
                        return countries[i];
                    }
                }
                for (let i = 0; i < countries.length; i++) {
                    if (countryFilterMap[countries[i]]) {
                        return countries[i];
                    }
                }
                return scope.country;
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
            function valueChanged() {
                let val = scope.phoneText;
                //detect country change
                if (val && val.length > 2 && val.charAt(0) === '+') {
                    let space = val.indexOf(' ');
                    if (space > 0 && space < 4 && dialCodeMap[val.substr(1, space - 1)] &&
                            (!scope.customCountryFilter || getCountry(val.substr(1, space - 1)) !== null)) {
                        scope.country = findBestCountryMatch(val.substr(1, space - 1));
                        let example = utils.getExampleNumber(scope.country, 0, utils.numberType.MOBILE);
                        scope.phoneHint = example;
                    }
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
            scope.isCountryListVisible = false;
            scope.input = {searchText: ''};
            if (scope.customCountryFilter) {
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
            } else {
                scope.countries = allCountries;
            }
            scope.phoneChanged = function () {
                valueChanged();
            };
            scope.setCountry = function (c) {
                scope.country = c.iso2;
                scope.isCountryListVisible = false;
                scope.input.searchText = '';
                let example = utils.getExampleNumber(scope.country, 0, utils.numberType.MOBILE);
                scope.phoneHint = example;
                valueChanged();
            };
            scope.toggleSelector = function () {
                scope.isCountryListVisible = !scope.isCountryListVisible;
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
            let example = utils.getExampleNumber(scope.country, 0, utils.numberType.MOBILE);
            scope.phoneHint = example;
            window.addEventListener('click', windowClicked);
            scope.on('$destroy', () => {
                window.removeEventListener(windowClicked);
            });
        }
    };
}]);


module.exports = 'ng-intl-tel-mini';