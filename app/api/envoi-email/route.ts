import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// On initialise Resend avec la clé secrète de ton fichier .env.local
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { emails, sujet, messageHtml } = body;

    // Resend exige que l'adresse d'expédition soit vérifiée. 
    // Pour les tests, ils fournissent "onboarding@resend.dev"
    const { data, error } = await resend.emails.send({
      from: 'ChurchHub App <onboarding@resend.dev>',
      to: emails,
      subject: sujet,
      html: messageHtml,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}