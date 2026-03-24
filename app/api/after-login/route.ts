import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return Response.redirect(new URL("/login1", req.url));
  }

  // هنا تسوي call للـ proxy مرة ثانية
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/proxy-verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: session.user.email,
      name: session.user.name,
      provider: "microsoft",
    }),
  });

  const data = await res.json();

  if (data?.redirect) {
    return Response.redirect(data.redirect);
  }

  return Response.redirect(new URL("/", req.url));
}
