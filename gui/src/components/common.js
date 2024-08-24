import moment from "moment";

export const copy_toast = () => {
  window.app.$toastr.s("Copied to clipboard successfully.");
};

export const convertToCurrentTimeZone = (dateTimeString) => {
  const momentObj = moment(dateTimeString);
  const convertedMoment = momentObj.utcOffset(moment().utcOffset());
  return convertedMoment.format(); // 返回转换后的日期时间字符串
};
