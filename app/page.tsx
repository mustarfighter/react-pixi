// pages/index.js
"use client";
import Head from 'next/head';
import PixiCanvas from '../components/PixiCropper';

export default function Home() {
    return (
        <div>
            <Head>
                <title>Pixi.js with Next.js</title>
                <meta name="description" content="Integrating PIXI.js with Next.js" />
            </Head>

            <main>
                <h1></h1>
                <PixiCanvas />
            </main>
        </div>
    );
}
