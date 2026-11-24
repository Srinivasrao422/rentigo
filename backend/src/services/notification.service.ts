/**
 * Notification / Email Service
 * Logs structured transactional emails and alerts.
 * Readily swappable with Resend, SendGrid, or AWS SES.
 */

export interface EmailPayload {
  to: string;
  subject: string;
  template: "BOOKING_REQUEST" | "BOOKING_APPROVED" | "BOOKING_REJECTED" | "BOOKING_CANCELLED" | "WELCOME";
  context: Record<string, any>;
}

export class NotificationService {
  static async sendEmail(payload: EmailPayload): Promise<boolean> {
    const timestamp = new Date().toISOString();
    console.log(`\n📧 [EMAIL NOTIFICATION] [${timestamp}]`);
    console.log(`   To: ${payload.to}`);
    console.log(`   Subject: ${payload.subject}`);
    console.log(`   Template: ${payload.template}`);
    console.log(`   Data:`, JSON.stringify(payload.context, null, 2));
    console.log(`----------------------------------------------------\n`);
    return true;
  }

  static async notifyBookingCreated(booking: any, customer: any, vehicle: any, agency: any) {
    return this.sendEmail({
      to: agency.contactEmail,
      subject: `New Booking Request #${booking.bookingNumber} for ${vehicle.brand} ${vehicle.model}`,
      template: "BOOKING_REQUEST",
      context: {
        bookingNumber: booking.bookingNumber,
        customerName: `${customer.firstName} ${customer.lastName}`,
        vehicle: `${vehicle.brand} ${vehicle.model} (${vehicle.year})`,
        startDate: booking.startDate,
        endDate: booking.endDate,
        totalAmount: booking.totalAmount,
      },
    });
  }

  static async notifyBookingStatusChange(
    booking: any,
    customer: any,
    vehicle: any,
    status: string,
    reason?: string
  ) {
    const templateMap: Record<string, EmailPayload["template"]> = {
      APPROVED: "BOOKING_APPROVED",
      REJECTED: "BOOKING_REJECTED",
      CANCELLED: "BOOKING_CANCELLED",
    };

    const template = templateMap[status] || "BOOKING_REQUEST";
    const subjectMap: Record<string, string> = {
      APPROVED: `Booking Confirmed! #${booking.bookingNumber} - ${vehicle.brand} ${vehicle.model}`,
      REJECTED: `Booking Update: Request #${booking.bookingNumber} was Declined`,
      CANCELLED: `Booking #${booking.bookingNumber} has been Cancelled`,
    };

    return this.sendEmail({
      to: customer.email,
      subject: subjectMap[status] || `Booking Status Updated: #${booking.bookingNumber}`,
      template,
      context: {
        customerName: `${customer.firstName} ${customer.lastName}`,
        bookingNumber: booking.bookingNumber,
        vehicle: `${vehicle.brand} ${vehicle.model}`,
        status,
        reason,
        startDate: booking.startDate,
        endDate: booking.endDate,
      },
    });
  }
}
