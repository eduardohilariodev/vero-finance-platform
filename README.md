# Vero Finance Platform

Welcome to your next-generation financial management application. This project is a comprehensive full-stack solution designed to handle payments, fund transfers, and financial requests with a modern, offline-first architecture.

## Tech Stack

This application is built using a simple yet powerful technology stack focused on performance, developer experience, and offline capability:

* **Framework**: **Next.js** is used for its hybrid static and server rendering, file-based routing (App Router), and overall robust React development experience.
* **Client-Side "Backend"**: **IndexedDB** serves as the application's database, operating entirely within the user's browser. This approach allows all data to be stored locally, providing a fast, secure, and offline-capable experience without the need for a traditional server-side database.

## Core Features & Workflows

The application's functionality is broken down into five core workflows, each visualized below using PlantUML.

### 1. Withdraw Funds

This workflow manages how users can withdraw funds from their account, supporting both cryptocurrency and traditional bank transfers. It includes security steps like OTP verification.

```plantuml
@startuml
title Withdraw Funds

start
if (Select Destination?) then (Deposit Cryptocurrency)
    :Connect Wallet;
    :Select network;
    :Confirm withdraw;
    note right
        Show the destination address
        Show withdraw fee (gas + offramp fee)
    end note
else (Bank Transfer)
    :Select Fiat Currency;
    note right
        Show withdraw fee (offramp fee)
    end note
    :Confirm Withdraw;
endif
:Send OTP email;
:Enter Code;
:Remove funds from company wallet;
:Send notification funds have been withdraw;
:Send transaction;
stop
@enduml
```

### 2. Send Payment

This workflow details the process of a user sending a payment. It includes checks for company existence, available funds, and scheduling options.

```plantuml
@startuml
title Send Payment

start
:Enter amount, due date and coin;
:Select Company;
if (Receiver Company exists?) then (yes)
else (no)
    :Add Company Details;
endif
if (Sender Company has funds?) then (yes)
    if (Is due today?) then (yes)
        :Send payment;
    else (no)
        :Schedule the Payment;
    endif
else (no)
    if (Is due today?) then (yes)
        :Add funds flow...;
        :Send payment;
    else (no)
        :Schedule the Payment;
        if (Do the user wants to add funds now?) then (yes)
            :Add funds flow...;
            :Send payment;
        else (no)
            :Notify user of insufficient balance;
            stop
        endif
    endif
endif

if (Receiver Company exists? after payment) then (yes)
    :Send Payment;
    :Send Email to receiver;
    -> Go to dashboard;
else (no)
    :Create Company;
    :Send Payment;
    :Send Email to receiver;
    -> Go to dashboard;
endif
stop
@enduml
```

### 3. Accept Payment

This workflow outlines how a user can respond to a payment request, with options to accept or reject it.

```plantuml
@startuml
title Accept Payment

start
:Open Payment Request;
note right
    - Receiving Company
    - Show amount
    - When the payment is DUE
end note
if (Decision?) then (Accept)
    if (Company has funds?) then (yes)
        if (Is due today?) then (yes)
            :Send payment;
            :Send notification payment received;
        else (no)
            :Schedule the Payment;
        endif
    else (no)
        if (Is due today?) then (yes)
            :Add funds flow...;
            :Send payment;
        else (no)
            :Schedule the Payment;
        endif
    endif
else (Reject)
    :Send notification request schedule rejected;
    :Cancel the payment;
endif
stop
@enduml
```

### 4. Request Payment

This workflow allows users to create and send a payment request to another entity.

```plantuml
@startuml
title Request Payment

start
:Enter amount, due date and coin;
:Select Company;
if (Company exists?) then (yes)
else (no)
    :Add Company Details;
endif
:Send Request;
if (Company exists? again) then (yes)
    :Create Request;
else (no)
    :Create Company;
    :Create Request;
endif
:Send Email to payer;
-> Return to Requests;
stop
@enduml
```

### 5. Add Funds

This workflow covers the two methods for users to add funds to their account: cryptocurrency deposits and bank transfers.

```plantuml
@startuml
title Add Funds

start
if (Select Type of funds?) then (Deposit Cryptocurrency)
    :Connect Wallet;
    note right
        - Show supported networks and tokens
        - Show conversion information
        - QR code and deposit address
    end note
    :Deposit Funds;
    :Detect funds deposited on chain;
    if (Is Stable?) then (yes)
    else (no)
        if (Has route to stable?) then (yes)
        else (no)
            :Return amount minus gas fee;
            stop
        endif
    endif
else (Bank Transfer)
    :Select Fiat Currency;
    note right
        - Show bank information for transfer
        - Show deposit fee (gat + onramp fee)
    end note
    :Deposit Funds;
endif
:Convert to stable;
:Convert at market value with market up;
:Add funds to the company wallet;
split
    :Send notification deposit complete;
split again
    :Send amount to staking pool to generate yield;
endsplit
stop
@enduml
```

## Getting Started

To get this project running on your local machine, you will need to have Node.js and a package manager (like npm or yarn) installed.

### Installation

First, clone the repository from your source control provider. Once cloned, navigate into the project directory and install the necessary dependencies using your preferred package manager. After the installation is complete, you can start the development server. The application will then be accessible in your web browser, typically at `http://localhost:3000`.
