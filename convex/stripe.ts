"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";
import Stripe from "stripe";

export const createCustomer = action({
    args: {},
    handler: async (ctx): Promise<string> => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthenticated");
        }

        const user = await ctx.runQuery(api.users.getUserByClerkIdQuery, {
            clerkId: identity.subject,
        });

        if (!user) {
            throw new Error("User not found");
        }

        if (user.stripeCustomerId) {
            return user.stripeCustomerId;
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: "2025-12-15.clover",
        });

        // 1. Search for existing customer by email
        const existingCustomers = await stripe.customers.list({
            email: user.email,
            limit: 1,
        });

        let customerId: string;

        if (existingCustomers.data.length > 0) {
            // Found existing customer
            customerId = existingCustomers.data[0].id;
            console.log(`Found existing Stripe customer for ${user.email}: ${customerId}`);
        } else {
            // Create new customer
            const customer = await stripe.customers.create({
                email: user.email,
                name: user.name,
                metadata: {
                    clerkId: user.clerkId,
                    userId: user._id,
                },
            });
            customerId = customer.id;
            console.log(`Created new Stripe customer for ${user.email}: ${customerId}`);
        }

        await ctx.runMutation(internal.internal.setStripeCustomerId, {
            userId: user._id,
            stripeCustomerId: customerId,
        });

        return customerId;
    },
});

export const linkStripeCustomerByEmail = action({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthenticated");
        }

        const user = await ctx.runQuery(api.users.getUserByClerkIdQuery, {
            clerkId: identity.subject,
        });

        if (!user) {
            throw new Error("User not found");
        }

        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
            apiVersion: "2025-12-15.clover",
        });

        const customers = await stripe.customers.list({
            email: args.email,
            limit: 1,
        });

        if (customers.data.length === 0) {
            return { success: false, message: "入力されたメールアドレスのStripe顧客が見つかりませんでした。" };
        }

        const customerId = customers.data[0].id;

        await ctx.runMutation(internal.internal.setStripeCustomerId, {
            userId: user._id,
            stripeCustomerId: customerId,
        });

        return { success: true, message: "Stripeアカウントの連携が完了しました。" };
    },
});
