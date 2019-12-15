"use strict";

const co = require("co");
const _ = require("lodash");
const moment = require('moment');
const util = require("util");
const errors = require("../helpers/errors");
const models = require("../models");
const db = require("../helpers/db");
const jwt = require("../helpers/jwt");
const utils = require("../helpers/utils");
const config = require('config');

const sequelize = models.sequelize;
const Sequelize = models.Sequelize;
const Op = Sequelize.Op;

const User = models.User;
const UserRole = models.UserRole;
const Activity = models.Activity;
// const Password = models.Password;

module.exports = {
    getPriceRangeGenderCombination,
    getBranchNewMembersCombination,
    getGenderDemographicsCombination,
    getCustomerAgeRangeCombination,
    getLivedCityCombination,
    getMembersCombination
};


/**
 * Gets the average transaction per gender. non-anonymous
 *
 * @param   {Object}    auth          the currently authenticated user
 * @param   {Object}    [params]      the parameters for the method
 */
function* getPriceRangeGenderCombination(auth, params, entity) {
    params = _.mapValues(params, function (v) {
        return v.value;
    });
    let daily = yield db.retrievePriceRangeGender("date");
    let monthly = yield db.retrievePriceRangeGender("month");
    let yearly = yield db.retrievePriceRangeGender("year");
    let result = yield utils.chartSkeleton(["female", "male"]);
    daily.forEach((day) => {
        var keyDate = "Day " + moment(day.datetime).format("D");
        result["daily"][keyDate] = {
            female: day["female"],
            male: day["male"]
        }
    })
    monthly.forEach((day) => {
        var keyDate = moment(day.datetime).format("MMMM");
        result["monthly"][keyDate] = {
            female: day["female"],
            male: day["male"]
        }
    })
    yearly.forEach((day) => {
        var keyDate = moment(day.datetime).format("YYYY");
        result["yearly"][keyDate] = {
            female: day["female"],
            male: day["male"]
        }
    })
    return result;
}

/**
 * Gets the count of new members per city. non-anonymous
 *
 * @param   {Object}    auth          the currently authenticated user
 * @param   {Object}    [params]      the parameters for the method
 */
function* getBranchNewMembersCombination(auth, params, entity) {
    params = _.mapValues(params, function (v) {
        return v.value;
    });
    let daily = yield db.retrieveBranchNewMembers("date");
    let monthly = yield db.retrieveBranchNewMembers("month");
    let yearly = yield db.retrieveBranchNewMembers("year");
    let result = yield utils.chartSkeleton(_.map(yearly, 'city'));

    daily.forEach((day) => {
        var keyDate = "Day " + moment(day.datetime).format("D");
        if (!result["daily"].hasOwnProperty(keyDate)) result["daily"][keyDate] = {};
        result["daily"][keyDate][day["city"]] = day["count"];
    });
    monthly.forEach((day) => {
        var keyDate = moment(day.datetime).format("MMMM");
        if (!result["monthly"].hasOwnProperty(keyDate)) result["monthly"][keyDate] = {};
        result["monthly"][keyDate][day["city"]] = day["count"];
    });
    yearly.forEach((day) => {
        var keyDate = moment(day.datetime).format("YYYY");
        if (!result["yearly"].hasOwnProperty(keyDate)) result["yearly"][keyDate] = {};
        result["yearly"][keyDate][day["city"]] = day["count"];
    });

    return result;
}

/**
 * Gets the count of males and females account. non-anonymous
 *
 * @param   {Object}    auth          the currently authenticated user
 * @param   {Object}    [params]      the parameters for the method
 */
function* getGenderDemographicsCombination(auth, params, entity) {
    params = _.mapValues(params, function (v) {
        return v.value;
    });
    let daily = yield db.retrieveGenderDemographics("date");
    let monthly = yield db.retrieveGenderDemographics("month");
    let yearly = yield db.retrieveGenderDemographics("year");
    let result = yield utils.chartSkeleton(["female", "male"]);
    daily.forEach((day) => {
        var keyDate = "Day " + moment(day.datetime).format("D");
        result["daily"][keyDate] = {
            female: day["female"],
            male: day["male"]
        }
    })
    monthly.forEach((day) => {
        var keyDate = moment(day.datetime).format("MMMM");
        result["monthly"][keyDate] = {
            female: day["female"],
            male: day["male"]
        }
    })
    yearly.forEach((day) => {
        var keyDate = moment(day.datetime).format("YYYY");
        result["yearly"][keyDate] = {
            female: day["female"],
            male: day["male"]
        }
    })
    return result;
}

/**
 * Gets the total number of males and females per age bracket. non-anonymous
 *
 * @param   {Object}    auth          the currently authenticated user
 * @param   {Object}    [params]      the parameters for the method
 */
function* getCustomerAgeRangeCombination(auth, params, entity) {
    params = _.mapValues(params, function (v) {
        return v.value;
    });
    let daily = yield db.retrieveCustomerAgeRange("date");
    let monthly = yield db.retrieveCustomerAgeRange("month");
    let yearly = yield db.retrieveCustomerAgeRange("year");
    let result = yield utils.chartSkeleton(["10-20", "21-30", "31-40", "41-65", "65 and above"]);
    daily.forEach((day) => {
        var keyDate = "Day " + moment(day.datetime).format("D");
        result["daily"][keyDate] = {
            "10-20": day["10-20"],
            "21-30": day["21-30"],
            "31-40": day["31-40"],
            "41-65": day["41-65"],
            "65 and above": day["65 and above"]
        }
    })
    monthly.forEach((day) => {
        var keyDate = moment(day.datetime).format("MMMM");
        result["monthly"][keyDate] = {
            "10-20": day["10-20"],
            "21-30": day["21-30"],
            "31-40": day["31-40"],
            "41-65": day["41-65"],
            "65 and above": day["65 and above"]
        }
    })
    yearly.forEach((day) => {
        var keyDate = moment(day.datetime).format("YYYY");
        result["yearly"][keyDate] = {
            "10-20": day["10-20"],
            "21-30": day["21-30"],
            "31-40": day["31-40"],
            "41-65": day["41-65"],
            "65 and above": day["65 and above"]
        }
    });
    console.log(result);
    return result;
}

/**
 * Gets the number of members per city. non-anonymous
 *
 * @param   {Object}    auth          the currently authenticated user
 * @param   {Object}    [params]      the parameters for the method
 */
function* getLivedCityCombination(auth, params, entity) {
    params = _.mapValues(params, function (v) {
        return v.value;
    });
    let daily = yield db.retrieveLivedCity("date");
    let monthly = yield db.retrieveLivedCity("month");
    let yearly = yield db.retrieveLivedCity("year");
    let result = yield utils.chartSkeleton(_.map(yearly, 'city'));
    let total = _.sumBy(daily, function (o) { return o.count; });
    daily.forEach((day) => {
        var keyDate = "Day " + moment(day.datetime).format("D");
        if (!result["daily"].hasOwnProperty(keyDate)) result["daily"][keyDate] = {};
        result["daily"][keyDate][day["city"]] = day["count"] / total;
    });
    total = _.sumBy(monthly, function (o) { return o.count; });
    monthly.forEach((day) => {
        var keyDate = moment(day.datetime).format("MMMM");
        if (!result["monthly"].hasOwnProperty(keyDate)) result["monthly"][keyDate] = {};
        result["monthly"][keyDate][day["city"]] = day["count"] / total;
    });
    total = _.sumBy(yearly, function (o) { return o.count; });
    yearly.forEach((day) => {
        var keyDate = moment(day.datetime).format("YYYY");
        if (!result["yearly"].hasOwnProperty(keyDate)) result["yearly"][keyDate] = {};
        result["yearly"][keyDate][day["city"]] = day["count"] / total;
    });

    return result;
}

/**
 * Gets the total number of members and total number of new members. non-anonymous
 *
 * @param   {Object}    auth          the currently authenticated user
 * @param   {Object}    [params]      the parameters for the method
 */
function* getMembersCombination(auth, params, entity) {
    params = _.mapValues(params, function (v) {
        return v.value;
    });
    let startDate = moment().subtract(1, 'month').endOf('month').format('YYYY-MM-DD');
    let daily = yield db.retrieveMembersCount("date", startDate);
    let dailyLastCount = yield db.retrieveMembersLastCount(startDate);
    startDate = moment().format('YYYY') - 1;
    let monthly = yield db.retrieveMembersCount("month", `${startDate}-12-31`);
    let monthlyLastCount = yield db.retrieveMembersLastCount(startDate);
    let yearly = yield db.retrieveMembersCount("year");
    let result = yield utils.chartSkeleton(["total_count", "new_members_count"]);

    var dailyObj = daily.reduce((obj, item) => (
        obj[`Day ${moment(item.datetime).format("D")}`] = item.count, obj
    ) ,{});
    const currentDay = moment().format('D');
    for (let i = 1; i <= currentDay; i++) {
        var keyDate = `Day ${i}`;
        if(i == 1) result["daily"][keyDate] = {
            total_count: dailyLastCount[0].count + (dailyObj.hasOwnProperty(keyDate) ? dailyObj[keyDate] : 0),
            new_members_count: dailyObj.hasOwnProperty(keyDate) ? dailyObj[keyDate] : 0
        };
        else result["daily"][keyDate] = {
            total_count: result["daily"][`Day ${i-1}`]["total_count"] + (dailyObj.hasOwnProperty(keyDate) ? dailyObj[keyDate] : 0),
            new_members_count: dailyObj.hasOwnProperty(keyDate) ? dailyObj[keyDate] : 0
        };
    };
    result["daily"]["total"] = result["daily"][`Day ${currentDay}`]["total_count"];

    var monthlyObj = monthly.reduce((obj, item) => (
        obj[moment(item.datetime).format("MMMM")] = item.count, obj
    ) ,{});
    const months = moment.months();
    let currentMonth = moment().format("M");
    for (let i = 0; i < currentMonth; i++) {
        if(i == 0) result["monthly"][months[i]] = {
            total_count: monthlyLastCount[0].count + (monthlyObj.hasOwnProperty(months[i]) ? monthlyObj[months[i]] : 0),
            new_members_count: monthlyObj.hasOwnProperty(months[i]) ? monthlyObj[months[i]] : 0
        };
        else result["monthly"][months[i]] = {
            total_count: result["monthly"][months[i - 1]]["total_count"] + (monthlyObj.hasOwnProperty(months[i]) ? monthlyObj[months[i]] : 0),
            new_members_count: monthlyObj.hasOwnProperty(months[i]) ? monthlyObj[months[i]] : 0
        };
    };
    result["monthly"]["total"] = result["monthly"][months[currentMonth-1]]["total_count"];

    for (let i = 0; i < yearly.length; i++) {
        var keyDate = moment(yearly[i].datetime).format("YYYY");
        if(i==0) result["yearly"][keyDate] = {
            total_count: yearly[i]["count"],
            new_members_count: yearly[i]["count"]
        }
        else result["yearly"][keyDate] = {
            total_count: result["yearly"][keyDate - 1]["total_count"] + yearly[i]["count"],
            new_members_count: yearly[i]["count"]
        }
        result["yearly"]["total"] = result["yearly"][keyDate]["total_count"];
    }
    
    return result;
}