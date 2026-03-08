import React from 'react'
import { redirect } from 'next/navigation'

const page = () => {
    redirect("/store/dashboard");
    return null
}

export default page