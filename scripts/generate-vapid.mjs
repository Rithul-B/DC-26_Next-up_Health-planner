import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();
process.stdout.write(
  [
    `# Add these to .env and to Vercel → Environment Variables`,
    `VAPID_PUBLIC_KEY="${keys.publicKey}"`,
    `VAPID_PRIVATE_KEY="${keys.privateKey}"`,
    `NEXT_PUBLIC_VAPID_PUBLIC_KEY="${keys.publicKey}"`,
    `VAPID_SUBJECT="mailto:next-up@localhost"`,
    "",
  ].join("\n"),
);
