import { NextResponse } from "next/server";
import {auth} from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function POST() {
    const {userId} = await auth()

    if(!userId) {
        return new NextResponse("Unauthorized", {status: 401})
    }

    try {
        const user = await prisma.user.findUnique({where: {id: userId}})

        if(!user) {
            return new NextResponse("User not found", {status: 401})
        }

        const subscriptionEnds = new Date()
        subscriptionEnds.setMonth(subscriptionEnds.getMonth() + 1)

        const updatedUser = await prisma.user.update({
            where: {id: userId},
            data: {
                isSubscribed: true,
                subscriptionEnds
            }
        })

        return NextResponse.json({
            message: "Successfully subscribed",
            subscriptionEnds: updatedUser.subscriptionEnds
        }, {status: 200})
        
    } catch (error) {
        console.error("error updating subscription", error)
        return new NextResponse("Error updating subscription", {status: 500})
        
    }

}

export async function GET() {
    const {userId} = await auth()

    if(!userId) {
        return new NextResponse("Unauthorized", {status: 401})
    }

    try {
        const user = await prisma.user.findUnique(
            {
                where: {id: userId},
                select: {
                    isSubscribed: true,
                    subscriptionEnds: true 
                }        
            },
        )

        if(!user) {
            return new NextResponse("User not found", {status: 401})
        }

        const now = new Date()

        if(user.subscriptionEnds && user.subscriptionEnds < now) {
            await prisma.user.update({
                where: {id: userId},
                data: {
                    isSubscribed: false,
                    subscriptionEnds: null
                }
            })
            return NextResponse.json({
                isSubscribed: false,
                subscriptionEnds: null
            })
        }

        return NextResponse.json({
            isSubscribed: user.isSubscribed,
            subscriptionEnds: user.subscriptionEnds
        })
        
    } catch (error) {
        console.error("error updating subscription", error)
        return new NextResponse("Error updating subscription", {status: 500})        
    }
    
}