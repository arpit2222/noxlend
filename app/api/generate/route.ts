import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json();
    
    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required and must be a string" },
        { status: 400 }
      );
    }

    const apiKey = process.env.NEXT_PUBLIC_CHAINGPT_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ChainGPT API key not configured" },
        { status: 500 }
      );
    }

    const enhancedPrompt = `${prompt}

Use Solidity ^0.8.28. Use iExec Nox library for confidential operations:
import {Nox, euint256, externalEuint256, ebool} from "@iexec-nox/nox-protocol-contracts/contracts/sdk/Nox.sol";
import {IERC7984} from "@iexec-nox/nox-confidential-contracts/contracts/interfaces/IERC7984.sol";
import {IERC7984Receiver} from "@iexec-nox/nox-confidential-contracts/contracts/interfaces/IERC7984Receiver.sol";

Deploy on Arbitrum Sepolia. Follow best practices for DeFi lending protocols.
Include proper access control, events, and error handling.
Make sure all euint256 operations call Nox.allowThis() and Nox.allow() for ACL.`;

    const response = await fetch("https://api.chaingpt.org/chat/stream", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "smart_contract_generator",
        question: enhancedPrompt,
        chatHistory: "off",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ChainGPT API error:", errorText);
      return NextResponse.json(
        { error: "Failed to generate contract code" },
        { status: 500 }
      );
    }

    const data = await response.json();
    const code = data?.data?.bot || "";

    if (!code) {
      return NextResponse.json(
        { error: "No code generated from ChainGPT" },
        { status: 500 }
      );
    }

    return NextResponse.json({ code });
  } catch (error) {
    console.error("API route error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
