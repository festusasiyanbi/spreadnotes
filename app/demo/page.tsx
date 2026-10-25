import { pageMetadata } from "../../features/seo/metadata";
import { DemoApp } from "../../features/demo/DemoApp";
export const metadata = pageMetadata("demo");
export default function Page() { return <DemoApp />; }
