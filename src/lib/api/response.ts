/**
 * Standard API response helpers.
 */

export function jsonResponse<T>(data: T, status = 200): Response {
  return Response.json(data, { status });
}

export function createdResponse<T>(data: T): Response {
  return Response.json(data, { status: 201 });
}

export function noContentResponse(): Response {
  return new Response(null, { status: 204 });
}
