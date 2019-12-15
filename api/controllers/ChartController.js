'use strict';

const co = require('co');
const ChartService = require('../services/ChartService');

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
 * @param req the request
 * @param res the response
 */
function getPriceRangeGenderCombination(req, res, next) {
    co(function* () {
        res.json(yield ChartService.getPriceRangeGenderCombination(req.auth, req.swagger.params));
    }).catch(next);
}

/**
 * Gets the count of new members per city. non-anonymous
 *
 * @param req the request
 * @param res the response
 */
function getBranchNewMembersCombination(req, res, next) {
    co(function* () {
        res.json(yield ChartService.getBranchNewMembersCombination(req.auth, req.swagger.params));
    }).catch(next);
}

/**
 * Gets the count of males and females account. non-anonymous
 *
 * @param req the request
 * @param res the response
 */
function getGenderDemographicsCombination(req, res, next) {
    co(function* () {
        res.json(yield ChartService.getGenderDemographicsCombination(req.auth, req.swagger.params));
    }).catch(next);
}

/**
 * Gets the total number of males and females per age bracket. non-anonymous
 *
 * @param req the request
 * @param res the response
 */
function getCustomerAgeRangeCombination(req, res, next) {
    co(function* () {
        res.json(yield ChartService.getCustomerAgeRangeCombination(req.auth, req.swagger.params));
    }).catch(next);
}

/**
 * Gets the number of members per city. non-anonymous
 *
 * @param req the request
 * @param res the response
 */
function getLivedCityCombination(req, res, next) {
    co(function* () {
        res.json(yield ChartService.getLivedCityCombination(req.auth, req.swagger.params));
    }).catch(next);
}

/**
 * Gets the total number of members and total number of new members. non-anonymous
 *
 * @param req the request
 * @param res the response
 */
function getMembersCombination(req, res, next) {
    co(function* () {
        res.json(yield ChartService.getMembersCombination(req.auth, req.swagger.params));
    }).catch(next);
}