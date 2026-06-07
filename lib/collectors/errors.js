export function collectorErrorPayload(error) {
  const payload = {
    error: error?.message || "采集请求失败"
  };

  if (error?.code) payload.code = error.code;
  if (error?.action) payload.action = error.action;

  return payload;
}
