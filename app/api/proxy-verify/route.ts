import { NextRequest, NextResponse } from "next/server";

// تفعيل Node.js runtime للسماح بطلبات HTTP
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log("📤 Sending verification request:", body.email);

    // إنشاء AbortController للتحكم في timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

    const res = await fetch(
      "http://jobsboard.mywebcommunity.org/verify-microsoft.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(body),
        signal: controller.signal,
        // @ts-ignore - للسماح بطلبات HTTP في Next.js
        cache: "no-store",
      }
    );

    clearTimeout(timeoutId);

    if (!res.ok) {
      console.error("❌ HTTP Error:", res.status, res.statusText);
      return NextResponse.json({
        success: false,
        message: `HTTP Error: ${res.status}`
      });
    }

    const text = await res.text();
    console.log("📥 Raw response:", text);

    // محاولة parse JSON
    let data;
    try {
      data = JSON.parse(text);
    } catch (parseErr) {
      console.error("❌ JSON Parse error:", parseErr);
      return NextResponse.json({
        success: false,
        message: "Invalid response from server"
      });
    }

    console.log("✅ Verification result:", data);
    return NextResponse.json(data);

  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.error("❌ Request timeout");
      return NextResponse.json({ success: false, message: "Request timeout" });
    }
    console.error("❌ Proxy verify error:", err.message || err);
    return NextResponse.json({ success: false, message: "Server error: " + (err.message || "Unknown") });
  }
}

// دعم OPTIONS للـ CORS
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
