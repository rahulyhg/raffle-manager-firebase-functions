"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const isEmpty = require("lodash.isempty");
function transformObjectToList(tickets) {
    if (!isEmpty(tickets)) {
        const list = [];
        Object.keys(tickets).forEach(k => {
            list.push(tickets[k]);
        });
        return list;
    }
    return null;
}
exports.transformObjectToList = transformObjectToList;
//# sourceMappingURL=utils.js.map