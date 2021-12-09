"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Modules to control application life and create native browser window
var electron_1 = require("electron");
var path = __importStar(require("path"));
var fs = __importStar(require("fs"));
var jszip_1 = __importDefault(require("jszip"));
var url = __importStar(require("url"));
var mainWindow = null;
var args = process.argv.slice(1);
var serveParam = args.find(function (arg) { return arg.startsWith('--serve='); });
function createWindow() {
    var electronScreen = electron_1.screen;
    var size = electronScreen.getPrimaryDisplay().workAreaSize;
    // Create the browser window.
    mainWindow = new electron_1.BrowserWindow({
        width: Math.round(size.width * 0.66),
        height: Math.round(size.height * 0.66),
        webPreferences: {
            //preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            // experimentalFeatures: true,
            allowRunningInsecureContent: false,
            // enableRemoteModule : true,
            contextIsolation: false
        }
    });
    // and load the index.html of the app.
    if (serveParam) {
        // Open the DevTools.
        mainWindow.webContents.openDevTools();
        require('electron-reload')(__dirname, {
            electron: require(__dirname + "/node_modules/electron")
        });
        mainWindow.loadURL(serveParam.split('=')[1]); // "http://localhost:3041/#" )
    }
    else {
        mainWindow.loadURL(url.format({
            pathname: path.join(__dirname, 'dist/index.html'),
            protocol: 'file:',
            slashes: true
        }));
    }
} // createWindow
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
electron_1.app.whenReady().then(function () {
    createWindow();
    electron_1.app.on('activate', function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (electron_1.BrowserWindow.getAllWindows().length === 0)
            createWindow();
    });
});
// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
electron_1.app.on('window-all-closed', function () {
    if (process.platform !== 'darwin')
        electron_1.app.quit();
});
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
electron_1.ipcMain.handle('opendialog', function (event, opendialogOptions) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!fs.existsSync(opendialogOptions.defaultPath || __dirname))
                    opendialogOptions.defaultPath = __dirname;
                return [4 /*yield*/, electron_1.dialog.showOpenDialog(mainWindow, opendialogOptions)];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); });
electron_1.ipcMain.handle('fs-stat', function (event, pathLike) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (Array.isArray(pathLike))
                    pathLike = path.join.apply(path, pathLike);
                return [4 /*yield*/, new Promise(function (resolve, reject) {
                        fs.stat(pathLike, function (err, stats) {
                            if (err)
                                reject(err);
                            else
                                resolve(stats);
                        });
                    })];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); });
electron_1.ipcMain.handle('fs-exist', function (event, pathLike) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (Array.isArray(pathLike))
                    pathLike = path.join.apply(path, pathLike);
                return [4 /*yield*/, new Promise(function (resolve, reject) {
                        fs.stat(pathLike, function (err, stats) {
                            if (err) {
                                if (err.code === 'ENOENT')
                                    resolve(false);
                                else
                                    reject(err);
                            }
                            else
                                resolve(true);
                        });
                    })];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); });
/**
 *
 */
electron_1.ipcMain.handle('fs-write', function (event, pathLike, data, zip64) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (Array.isArray(pathLike))
                    pathLike = path.join.apply(path, pathLike);
                return [4 /*yield*/, new Promise(function (resolve, reject) {
                        if (zip64) {
                            var zip = new jszip_1.default();
                            zip.loadAsync(data, { base64: true, createFolders: true })
                                .then(function (jsZip) { return jsZip.generateAsync({ type: 'nodebuffer', streamFiles: true })
                                .then(function (buffer) { return fs.writeFile(pathLike, buffer, function (err) { if (err)
                                reject(err);
                            else
                                resolve(true); }); })
                                .catch(function (error) { return reject(error); }); })
                                .catch(function (error) { return reject(error); });
                        }
                        else
                            fs.writeFile(pathLike, data, function (err) { if (err)
                                reject(err);
                            else
                                resolve(true); });
                    })];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); });
electron_1.ipcMain.handle('fs-read', function (event, pathLike, zip64) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (Array.isArray(pathLike))
                    pathLike = path.join.apply(path, pathLike);
                return [4 /*yield*/, new Promise(function (resolve, reject) {
                        fs.readFile(pathLike, function (err, data) {
                            if (err)
                                reject(err);
                            else {
                                if (zip64) {
                                    var zip = new jszip_1.default();
                                    zip.loadAsync(data, { base64: false, createFolders: true })
                                        .then(function (jsZip) { return jsZip.generateAsync({ type: 'base64', streamFiles: true })
                                        .then(function (base64) { return resolve(base64); })
                                        .catch(function (error) { return reject(error); }); })
                                        .catch(function (error) { return reject(error); });
                                }
                                else {
                                    resolve(data.toString('utf8'));
                                }
                            }
                        });
                    })];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); });
electron_1.ipcMain.handle('fs-rename', function (event, pathLike, newFilename) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (Array.isArray(pathLike))
                    pathLike = path.join.apply(path, pathLike);
                return [4 /*yield*/, new Promise(function (resolve, reject) {
                        fs.rename(pathLike, newFilename, function (err) { if (err)
                            reject(err);
                        else
                            resolve(true); });
                    })];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); });
electron_1.ipcMain.handle('fs-copy', function (event, pathLike, newFilename) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (Array.isArray(pathLike))
                    pathLike = path.join.apply(path, pathLike);
                return [4 /*yield*/, new Promise(function (resolve, reject) {
                        fs.copyFile(pathLike, newFilename, function (err) { if (err)
                            reject(err);
                        else
                            resolve(true); });
                    })];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); });
electron_1.ipcMain.handle('fs-dir', function (event, command, pathLike, options) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (Array.isArray(pathLike))
                    pathLike = path.join.apply(path, pathLike);
                return [4 /*yield*/, new Promise(function (resolve, reject) {
                        switch (command) {
                            case 'mk':
                                fs.mkdir(pathLike, options ? options : { recursive: true }, function (err) { if (err)
                                    reject(err);
                                else
                                    resolve(true); });
                                break;
                            case 'rm':
                                fs.rmdir(pathLike, function (err) { if (err)
                                    reject(err);
                                else
                                    resolve(true); });
                                break;
                            case 'list':
                                fs.readdir(pathLike, { withFileTypes: true }, function (err, dirent) { if (err)
                                    reject(err);
                                else
                                    resolve(dirent); });
                                break;
                            case 'ren': fs.rename(pathLike, options, function (err) { if (err)
                                reject(err);
                            else
                                resolve(true); });
                            case 'empty': fs.stat;
                            default: reject("fs-dir: Unknown command " + command);
                        }
                    })];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); });
//# sourceMappingURL=main.js.map