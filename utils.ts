import { HttpParams, HttpRequest, HttpHeaders, HttpClient, HttpResponse } from '@angular/common/http';

export interface Point {
  x: number,
  y: number
};

export interface Size {
  width: number,
  height: number
};

export function distance(p1: Point, p2: Point) {
  const dx = Math.abs(p1.x - p2.x);
  const dy = Math.abs(p1.y - p2.y);
  return Math.sqrt(dx * dx + dy * dy);
}

export function includesPoint(pos: Point, from: Point, size: Size) {
  return (pos.x >= from.x && pos.x < (from.x + size.width)) &&
    (pos.y >= from.y && pos.y < (from.y + size.height));
}

export function intersects(p1: Point, size1: Size, p2: Point, size2: Size): boolean {
  return p1.x < (p2.x + size2.width) &&
    (p1.x + size1.width) > p2.x &&
    p1.y < (p2.y + size2.height) &&
    (p1.y + size1.height) > p2.y;
}

export function toInteger(value: any): number {
  return parseInt(`${value}`, 10);
}

export function isNumber(value: any): value is number {
  return !isNaN(toInteger(value));
}

export function padNumber(value: number, len: number) {
  if (isNumber(value)) {
    return ('' + value).padStart(len, '0');
  } else {
    return '';
  }
}

export function dateToHttpParam(date: Date): string {
  if (!date) return null;

  let year = date.getFullYear();
  let month = date.getMonth() + 1;
  let day = date.getDate();
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
}

export function getContentDispositionValues<T>(response: HttpResponse<T>) 
  : { name: string, value: string }[] {
    const contentDisposition = response.headers.get('Content-Disposition');
    return contentDisposition.split(';').map(x => x.trim())
                             .map(x => {
                               const ar = x.split('=');
                               return {
                                 name: ar[0],
                                 value: ar.length > 0 ? ar[1] : null
                               };
                             });
}

export function getResponseFilename<T>(response: HttpResponse<T>): string {
  const contentDispositionValues = getContentDispositionValues(response);
  const filenameItem = contentDispositionValues.find(v => v.name == 'filename');
  return filenameItem ? filenameItem.value : null;
}

export function getResponseUtfFilename<T>(response: HttpResponse<T>): string {
   const contentDispositionValues = getContentDispositionValues(response);
   const filenameItem = contentDispositionValues.find(v => v.name == 'filename*');
   return filenameItem ? decodeURI((filenameItem.value).substr(7)) : null;
}

export function dateToIso(date: Date): string {
  if (!date) return null;

  let year = date.getUTCFullYear();
  let month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  let day = date.getUTCDate().toString().padStart(2, '0');
  let hour = date.getUTCHours().toString().padStart(2, '0');
  let min = date.getUTCMinutes().toString().padStart(2, '0');
  let sec = date.getSeconds().toString().padStart(2, '0');
  return `${year}-${month}-${day}T${hour}:${min}:${sec}`;
}

export function createHttpParams(params: {}): HttpParams {
  let httpParams: HttpParams = new HttpParams();
  Object.keys(params).forEach(param => {
    if (params[param] != null) {
      let p = params[param];
      if (p instanceof Date) p = dateToHttpParam(p);

      httpParams = httpParams.set(param, p);
    }
  });

  return httpParams;
}

function sendFile<T>(http: HttpClient, url, files, data, op: 'post' | 'put') {
  const formData = new FormData();

  for (let fileParamName in files) {
    let file = files[fileParamName];
    formData.append(fileParamName, file, file.name);
  }

  for (let paramName in data) {
    formData.append(paramName, data[paramName]);
  }

  const headers = new HttpHeaders()
  headers.append('enctype', 'multipart/form-data');
  headers.append('Content-Type', 'multipart/form-data');

  return op == 'post'
    ? http.post<T>(url, formData, { headers })
    : op == 'put'
      ? http.put<T>(url, formData, { headers })
      : null;
}

export function postFile<T>(http: HttpClient, url, files, data = {}) {
  return sendFile<T>(http, url, files, data, 'post');
}

export function putFile<T>(http: HttpClient, url, files, data = {}) {
  return sendFile<T>(http, url, files, data, 'put');
}

export function clearTime(date: Date): Date {
  let dt = new Date(date.valueOf());
  dt.setHours(-dt.getTimezoneOffset() / 60, 0, 0, 0);

  return dt;
}

export function getSystemBeginDate(): Date {
  return localToUtc(new Date(2019, 0, 1));
}

export function getCurrentDate(): Date {
  return clearTime(new Date());
}

export function getDayLastMinute(date: Date): Date {
  let dt = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  dt.setUTCHours(23, 59, 0);

  return dt;
}

export function getMonthBegin(dt: Date): Date {
  return clearTime(new Date(dt.getFullYear(), dt.getMonth(), 1));
}

export function getMonthEnd(dt: Date): Date {
  return clearTime(new Date(dt.getFullYear(), dt.getMonth() + 1, 0));
}

export function getCurrentMonthBegin(): Date {
  return getMonthBegin(new Date());
}

export function getCurrentMonthEnd(): Date {
  return getMonthEnd(new Date());
}

export function localToUtc(d: Date): Date {
  return new Date(d.valueOf() - new Date().getTimezoneOffset() * 60000);
}

export function utcToLocal(d: Date): Date {
  return new Date(d.valueOf() + new Date().getTimezoneOffset() * 60000);
}

export function createBusyWrapper(): IBusyWrapper {
  let isBusy = false;
  let wrapper: any = function () {
    return isBusy;
  }
  wrapper.wrap = function <T>(promiseBuilder: () => Promise<T>): Promise<T> {
    if (isBusy) throw new Error('Is busy');

    isBusy = true;
    let promise = promiseBuilder();
    promise.then(() => isBusy = false, () => isBusy = false);

    return promise;
  };

  return wrapper;
}
type IBusyWrapperFunc = () => boolean;
export interface IBusyWrapper extends IBusyWrapperFunc {
  wrap<T>(promiseBuilder: () => Promise<T>): Promise<T>;
}

export function debounce(
  target: Object,
  propertyName: string,
  propertyDesciptor: PropertyDescriptor): PropertyDescriptor {

  const method = propertyDesciptor.value;

  let timerId = null;
  propertyDesciptor.value = function (...args: any[]) {
    if (timerId) clearTimeout(timerId);
    timerId = setTimeout(() => method.apply(this, args), 300);
  }
  return propertyDesciptor;
};

export class GridLoadWrapper {
  private curCallId: number = 0;
  public isLoading: boolean = false;

  constructor(
    private debounceTime: number = 300
  ) {
  }

  load<T>(promiseBuilder: () => Promise<T>) {
    this.curCallId++;
    let callId = this.curCallId;

    this.isLoading = true;
    return new Promise<T>((resolve, reject) => {
      setTimeout(() => {
        if (callId != this.curCallId) {
          reject({ debounced: true });
          return;
        }

        let promise = promiseBuilder();
        promise.then(r => {
          if (callId == this.curCallId) resolve(r);
          else reject({ debounced: true });
          this.isLoading = false;
        }, r => {
          this.isLoading = false;
          reject(r);
        });
      }, this.debounceTime);
    });
  }
}

export function readTextFromBlob(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      resolve(e.target.result);
    };
    
    reader.readAsText(blob);
  });
}

export function dataUrlToFile(dataUrl: string, filename: string): File {
  var arr = dataUrl.split(','),
      mime = arr[0].match(/:(.*?);/)[1],
      bstr = atob(arr[1]), 
      n = bstr.length, 
      u8arr = new Uint8Array(n);
      
  while(n--){
      u8arr[n] = bstr.charCodeAt(n);
  }
  
  return new File([u8arr], filename, {type:mime});
}

export function generateUid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export function getErrorMsg(errorResult) {
  return errorResult.error && errorResult.error.title
    ? errorResult.error.title
    : errorResult.message
      ? errorResult.message
      : errorResult.statusText
        ? errorResult.statusText
        : 'Неизестная ошибка';
}

export function getFileExtension(file: File) {
  return file.name
    ? file.name.split('.').pop()
    : null;
}

export function isImageFile(file: File) {
  let imgExtensions: string[] = ['jpg', 'png', 'gif'];
  return imgExtensions.includes(getFileExtension(file));
}

export function openFileInNewTab(fileBlob, reusableLink, download = null) {
  let anchor = document.createElement("a");
  anchor.setAttribute('target', '_blank');
  if (download) anchor.setAttribute('download', download);
  document.body.appendChild(anchor);

  let objectUrl = window.URL.createObjectURL(fileBlob);
  anchor.href = objectUrl;

  anchor.click();

  if (!reusableLink) window.URL.revokeObjectURL(objectUrl);
}

export function isMouseInsideOf(event, el) {
  let target = event.target;
  while (target) {
    if (target == el) return true;
    target = target.parentNode;
  }

  return false;
}

export function changeFileName(file: File, newName: string) {
  Object.defineProperty(file, 'name', {
    writable: true,
    value: newName
  });
}

export function blobToFile(blob: Blob, fileName: string): File {
  var b: any = blob;
  b.lastModifiedDate = new Date();
  b.name = fileName;

  return <File>blob;
}

export function selectDistinct<ArrayT, ResultT, IdT>(array: ArrayT[],
  idCallback: (ArrayT) => IdT,
  resultCallback: (ArrayT) => ResultT): ResultT[] {
  const result: ResultT[] = [];
  const map = new Map();
  for (const item of array) {
    const id = idCallback(item);
    if (map.has(id)) continue;

    map.set(id, true);
    result.push(resultCallback(item));
  }

  return result;
}

/*
  Меняет яркость цвета
  ярче: changeColorBright("#F06D06", 20);
  темнее: changeColorBright("#F06D06", -20); 
  https://css-tricks.com/snippets/javascript/lighten-darken-color/
*/
export function changeColorBright(col, amt) {
  var usePound = false;

  if (col[0] == "#") {
    col = col.slice(1);
    usePound = true;
  }

  var num = parseInt(col, 16);

  var r = Math.floor((num >> 16) * (1 + amt / 100));

  if (r > 255) r = 255;
  else if (r < 0) r = 0;

  var g = Math.floor(((num >> 8) & 0x00FF) * (1 + amt / 100));

  if (g > 255) g = 255;
  else if (g < 0) g = 0;

  var b = Math.floor((num & 0x0000FF) * (1 + amt / 100));

  if (b > 255) b = 255;
  else if (b < 0) b = 0;

  return (usePound ? "#" : "") + (
    r.toString(16).padStart(2, '0') +
    g.toString(16).padStart(2, '0') +
    b.toString(16).padStart(2, '0'));
}

export function transformPoints(points: Point[], pos: Point, w: number, h: number, padding: number): Point[] {
  let modifiedPoints: Point[] = points.map(p => {
    return {
      x: p.x * (w - 2 * padding) + pos.x + padding,
      y: p.y * (h - 2 * padding) + pos.y + padding
    };
  });

  return modifiedPoints;
}

export function getPointsForPolygon(points: Point[]): string {
  return points.reduce((total, p) => {
    return total + ' ' + p.x + ',' + p.y;
  }, '');
}

export function getCenterPos(points: Point[]): Point {
  return {
    x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
    y: points.reduce((sum, p) => sum + p.y, 0) / points.length
  };
}

export function getNearestPoint(p: Point): Point {
  return {
    x: Math.round(p.x),
    y: Math.round(p.y)
  };
}

export function getMinMaxPos(points: Point[]): { min: Point, max: Point } {
  if (points.length == 0) return null;

  let min = { x: points[0].x, y: points[0].y };
  let max = { x: points[0].x, y: points[0].y };

  points.forEach(p => {
    if (p.x < min.x) min.x = p.x;
    if (p.y < min.y) min.y = p.y;
    if (p.x > max.x) max.x = p.x;
    if (p.y > max.y) max.y = p.y;
  });

  return { min, max };
}

export function arePointsEquals(p1: Point, p2: Point): boolean {
  return p1.x == p2.x && p1.y == p2.y;
}

export function lowerFirstLetter(str: string): string {
  if (!str || str.length == 0) return str;

  return str.charAt(0).toLowerCase() + str.slice(1);
}