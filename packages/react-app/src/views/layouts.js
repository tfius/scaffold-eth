export function bytesToSize(bytes) {
  var sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  if (bytes == 0) return "0 Byte";
  var i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

export const layout = {
  labelCol: {
    span: 5,
  },
  wrapperCol: {
    span: 15,
  },
};
  
export const tailLayout = {
  wrapperCol: {
    offset: 5,
    span: 20,
  },
};