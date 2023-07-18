import {Injectable} from '@angular/core';
import {map, mergeMap, shareReplay} from 'rxjs/operators';
import {Observable, Subject, merge} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {DomSanitizer} from '@angular/platform-browser';
import {DeviceInfo} from './device-info-interface';
import {DeviceItem} from './device-item.interface';

@Injectable({
  providedIn: 'root',
})
export class DeviceService {
  private refreshSubject = new Subject<void>();

  private allDeviceFromServer = this.httpClient
    .get<DeviceItem[]>('./devices')
    .pipe(map(this.sortDevices));

  private allDevices = merge(
    this.allDeviceFromServer,
    this.refreshSubject.pipe(mergeMap(() => this.allDeviceFromServer))
  ).pipe(shareReplay(1));

  private getDevicesByGroupIdFromServer(groupId: string) {
    return this.httpClient
      .get<DeviceItem[]>(`./devices?groupId=${groupId}`)
      .pipe(map(this.sortDevices));
  }

  constructor(
    private readonly httpClient: HttpClient,
    private sanitizer: DomSanitizer
  ) {}

  private sortDevices(devices: DeviceItem[]) {
    return devices.sort((a: DeviceItem, b: DeviceItem) =>
      a['device_id'].localeCompare(b['device_id'], undefined, {numeric: true})
    );
  }

  refresh(): void {
    this.refreshSubject.next();
  }

  getDevices(groupId: string | null) {
    if (groupId === null) {
      return this.allDevices;
    }

    const selectedDevicesFromServer =
      this.getDevicesByGroupIdFromServer(groupId);

    return merge(
      selectedDevicesFromServer,
      this.refreshSubject.pipe(mergeMap(() => selectedDevicesFromServer))
    ).pipe(shareReplay(1));
  }

  getDeviceInfo(deviceId: string): Observable<DeviceInfo> {
    return this.httpClient
      .get('./devices/' + deviceId)
      .pipe(map(res => res as DeviceInfo));
  }
}
