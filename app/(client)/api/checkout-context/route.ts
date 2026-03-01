import {backendClient} from "@/sanity/lib/backendClient";
import {auth, currentUser} from "@clerk/nextjs/server";
import {NextResponse} from "next/server";

const PROFILE_QUERY = `*[_type == "customerProfile" && clerkUserId == $userId][0]{
  loyaltyCardNumber,
  loyaltyPoints,
  loyaltyTier,
  installmentsEligible
}`;

export async function GET() {
  try {
    const {userId} = await auth();
    if (!userId) {
      return NextResponse.json({error: "Unauthorized"}, {status: 401});
    }

    let profile = await backendClient.fetch<{
      loyaltyCardNumber?: string;
      loyaltyPoints?: number;
      loyaltyTier?: string;
      installmentsEligible?: boolean;
    } | null>(PROFILE_QUERY, {userId});

    if (!profile) {
      const user = await currentUser();
      const fullName = user?.fullName || "Customer";
      const email =
        user?.primaryEmailAddress?.emailAddress ||
        user?.emailAddresses[0]?.emailAddress ||
        "";

      profile = await backendClient.create({
        _type: "customerProfile",
        fullName,
        email,
        clerkUserId: userId,
        loyaltyCardNumber: `LOY-${userId.slice(0, 8).toUpperCase()}`,
        loyaltyPoints: 0,
        loyaltyTier: "bronze",
        installmentsEligible: false,
      });
    }

    return NextResponse.json({
      canUseInstallments: Boolean(profile.installmentsEligible),
      loyalty: {
        cardNumber: profile.loyaltyCardNumber || "",
        points: profile.loyaltyPoints || 0,
        tier: profile.loyaltyTier || "bronze",
      },
    });
  } catch (error) {
    console.error("Failed to load checkout context:", error);
    return NextResponse.json(
      {error: "Failed to load checkout context"},
      {status: 500}
    );
  }
}
