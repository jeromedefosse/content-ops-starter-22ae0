import '../css/main.css';
import Head from 'next/head';

export default function MyApp({ Component, pageProps }) {
    return (
        <>
            <Head>
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;600;700&display=swap"
                />
            </Head>
            <Component {...pageProps} />
        </>
    );
}
