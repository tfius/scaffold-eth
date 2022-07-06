export const RequestReviewDescriptions = [
  { ids: 0, text: "Request", description: "Your request is waiting in queue to be approved" },
  { ids: 1, text: "Approved", description: "Your request is now approved and is waiting for finalization" },
  {
    ids: 2,
    text: "Finalized",
    description:
      "Your request is now approved and finalized. Next validation steps are KYC, Investment, Manufacturer, Production. Only then issuance will occur.",
  },
  {
    ids: 3,
    text: "Approver rejected",
    description:
      "You did not provide enough information for project to be taken into consideration. Please resend required documentation.",
  },
  {
    ids: 4,
    text: "Finalization rejected",
    description:
      "Seems you did not provide reliable information about your project or there are many mismatches. Please resend required documentation.",
  },
];
