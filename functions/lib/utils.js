"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const isEmpty = require("lodash.isempty");
function transformObjectToList(obj) {
    if (!isEmpty(obj)) {
        const list = [];
        Object.keys(obj).forEach(k => {
            list.push(obj[k]);
        });
        return list;
    }
    return null;
}
exports.transformObjectToList = transformObjectToList;
function mergeTicketsToList(tickets) {
    if (!isEmpty(tickets)) {
        const list = [];
        Object.keys(tickets).forEach(k => {
            let ticket = Object.assign({}, tickets[k], { _id: k });
            list.push(ticket);
        });
        return list;
    }
    return null;
}
exports.mergeTicketsToList = mergeTicketsToList;
//# sourceMappingURL=utils.js.map