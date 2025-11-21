import { contractAddress, memberCategories, members } from "@utils/team-utils";
import { Contract, JsonRpcProvider } from "ethers";
import { useEffect, useState } from "react";

type ContractFunctionFragment = {
	type: string;
	name: string;
	inputs: { name: string; type: string; internalType: string }[];
	outputs: { name: string; type: string; internalType: string }[];
	stateMutability: string;
};

async function fetchTokenURIs(
	contractAddress: string,
	abi: ContractFunctionFragment[],
	address: string,
) {
	const provider = new JsonRpcProvider(
		"https://eth-holesky.g.alchemy.com/v2/EBEf6F0QcKepxVRoTYFdUsIj7iHd6NMo",
	);
	const contract = new Contract(contractAddress, abi, provider);
	try {
		const uris = await contract.getTokenUrisForAddress(address);
		return uris as string[];
	} catch (error) {
		console.error("Error during call tokenURI:", error);
		return null;
	}
}

async function loadABI(): Promise<ContractFunctionFragment[]> {
	const abi: ContractFunctionFragment[] = [
		{
			type: "function",
			name: "getTokenUrisForAddress",
			inputs: [{ name: "user", type: "address", internalType: "address" }],
			outputs: [{ name: "", type: "string[]", internalType: "string[]" }],
			stateMutability: "view",
		},
	];
	return abi;
}

function parseUriToImage(uris: string[] | null, name: string) {
	if (uris && uris.length > 0) {
		const lastUri = uris[uris.length - 1];
		const base64String = lastUri.split(",")[1];

		try {
			let decodedImageUri = JSON.parse(atob(base64String)).image as string;
			if (name !== "Alessandro Cavaliere") {
				decodedImageUri = decodedImageUri.replace("svg+xml", "png");
			}
			return decodedImageUri;
		} catch (error) {
			console.error("Error during of parsing URI:", error);
			return null;
		}
	}
	return null;
}

("use client");

import { getAuthorUrl } from "@utils/url-utils";
import { ExternalLink, Github } from "lucide-react";
import { Badge } from "./ui/babdge";

export type Member = {
	name: string;
	github: string;
	handle: string;
	university: string;
	categories: string[];
	address: string;
	link_etherscan: string;
};

interface MemberCardProps {
	member: Member;
	imageUrl?: string;
}

export function MemberCard({ member, imageUrl }: MemberCardProps) {
	return (
		<article className="group relative overflow-hidden rounded-[var(--radius-large)] border border-[color:var(--line-color)] bg-[color:var(--card-bg)] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
			{/* Header with Image and Basic Info */}
			<div className="relative border-b border-[color:var(--line-divider)] bg-gradient-to-br bg-[color:var(--page-bg)] p-6">
				<div className="flex items-start gap-2">
					{/* Avatar */}
					<a
						href={member.link_etherscan}
						target="_blank"
						rel="noopener noreferrer"
						className="relative flex-shrink-0 overflow-hidden rounded-xl ring-2 ring-[color:var(--line-color)] transition-all duration-300 hover:ring-4 hover:ring-[color:var(--primary-custom)]"
					>
						<div className="h-20 w-20 bg-[color:var(--btn-regular-bg)] sm:h-24 sm:w-24">
							<img
								src={imageUrl || "/placeholder-user.jpg"}
								alt={member.name}
								className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
							/>
						</div>
						<div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 hover:bg-black/20">
							<ExternalLink className="h-5 w-5 text-white opacity-0 transition-opacity duration-300 hover:opacity-100" />
						</div>
					</a>

					{/* Name and Handle */}
					<div className="flex-1 min-w-0">
						<a
							href={getAuthorUrl(member.handle)}
							target="_blank"
							rel="noopener noreferrer"
						>
							<h3 className="text-lg font-semibold text-white sm:text-xl hover:underline">
								{member.name}
							</h3>
						</a>
						{/* Role */}
						<p className="text-xs font-medium text-stone-400">
							{member.university}
						</p>
						<a
							href={member.github}
							target="_blank"
							rel="noopener noreferrer"
							className="group/link mt-1 inline-flex items-center gap-1.5 text-sm text-[color:var(--btn-content)] transition-colors hover:text-white"
						>
							<Github className="h-4 w-4" />
							<span className="font-mono">@{member.handle}</span>
							<ExternalLink className="h-3 w-3 opacity-0 transition-opacity group-hover/link:opacity-100" />
						</a>
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="space-y-4 p-6 pt-4">
				{/* Categories */}
				<div>
					<p className="mb-2 text-sm font-medium text-white">Categories</p>
					<div className="flex flex-wrap gap-2">
						{member.categories.map((category) => {
							const bg = memberCategories[category] || "var(--btn-regular-bg)";
							return (
								<Badge
									key={category}
									variant="secondary"
									className={
										"text-[color:var(--btn-content)] transition-colors hover:bg-[color:var(--btn-regular-bg-hover)]"
									}
									style={{ backgroundColor: bg }}
								>
									{category}
								</Badge>
							);
						})}
					</div>
				</div>

				{/* Etherscan Link */}
				{/*<a
          href={member.link_etherscan}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[color:var(--btn-regular-bg)] px-4 py-2.5 text-sm font-medium text-[color:var(--btn-content)] transition-all hover:bg-[color:var(--btn-regular-bg-hover)] active:bg-[color:var(--btn-regular-bg-active)]"
        >
          View on Etherscan
          <ExternalLink className="h-4 w-4" />
        </a>*/}
			</div>

			{/* Decorative gradient overlay */}
			<div className="pointer-events-none absolute inset-0 rounded-[var(--radius-large)] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
				<div className="absolute inset-0 bg-gradient-to-t from-[color:var(--primary-custom)]/5 to-transparent" />
			</div>
		</article>
	);
}

export default function MembersGrid() {
	const [images, setImages] = useState<Record<string, string>>({});
	const [isLoading, setIsLoading] = useState<boolean>(true);

	useEffect(() => {
		async function fetchAllImages() {
			try {
				const abi = await loadABI();

				const results = await Promise.all(
					members.map(async (member) => {
						const uris = await fetchTokenURIs(
							contractAddress,
							abi,
							member.address,
						);
						const image = parseUriToImage(uris, member.name);
						return {
							key: member.github,
							image: image || "/public/logo.png",
						};
					}),
				);

				const imagesMap: Record<string, string> = {};
				for (const result of results) {
					imagesMap[result.key] = result.image;
				}

				setImages(imagesMap);
			} catch (error) {
				console.error("Errore durante il caricamento delle immagini:", error);
			} finally {
				setIsLoading(false);
			}
		}

		fetchAllImages();
	}, []);

	if (isLoading) {
		return (
			<div className="flex w-full justify-center py-10">
				<div className="h-10 w-10 animate-spin rounded-full border-4 border-[color:var(--btn-regular-bg)] border-t-[color:var(--primary)]" />
			</div>
		);
	}

	return (
		<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
			{members.map((member) => (
				<MemberCard
					key={member.github}
					member={member}
					imageUrl={images[member.github] || "/public/logo.png"}
				/>
			))}
		</div>
	);
}
