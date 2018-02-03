import moment from 'moment';

export function convertFrameCountToDurationString(frameCount: number) {
  const duration = moment.duration(frameCount / 60, 'seconds');
  return moment.utc(duration.as('milliseconds')).format('m:ss');
}

export function convertToDateAndTime(dateTimeString: ?string) {
  if (!dateTimeString) {
    return null;
  }

  const time = moment(dateTimeString).local();
  return time.format("ll · LT");
}
