"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageType = void 0;
/**
 * Message types for WebSocket communication
 */
var MessageType;
(function (MessageType) {
    MessageType["JOIN_DOCUMENT"] = "JoinDocument";
    MessageType["LEAVE_DOCUMENT"] = "LeaveDocument";
    MessageType["CELL_UPDATE"] = "CellUpdate";
    MessageType["ROW_ADD"] = "RowAdd";
    MessageType["ROW_DELETE"] = "RowDelete";
    MessageType["COLUMN_ADD"] = "ColumnAdd";
    MessageType["COLUMN_DELETE"] = "ColumnDelete";
    MessageType["INIT_STATE"] = "InitState";
    MessageType["CELL_UPDATE_RESPONSE"] = "CellUpdateResponse";
    MessageType["ROW_ADD_RESPONSE"] = "RowAddResponse";
    MessageType["ROW_DELETE_RESPONSE"] = "RowDeleteResponse";
    MessageType["COLUMN_ADD_RESPONSE"] = "ColumnAddResponse";
    MessageType["COLUMN_DELETE_RESPONSE"] = "ColumnDeleteResponse";
    MessageType["ERROR"] = "Error";
})(MessageType || (exports.MessageType = MessageType = {}));
