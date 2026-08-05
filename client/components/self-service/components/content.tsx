import React from 'react';
import Header from './header';
import VisitRequestForm from './visit-request-form';

const VisitRequestContent = () => {
   return (
      <main className="min-h-dvh w-full bg-background">
         <Header />
         <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
            <div className="mb-6 space-y-1.5 sm:mb-8">
               <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  Request a Visit
               </h1>
               <p className="text-sm text-muted-foreground sm:text-base">
                  Complete the form below to submit your visit request for one
                  or more visitors, on a single day or across multiple days.
                  We&apos;ll notify you once your request has been reviewed.
               </p>
            </div>
            <VisitRequestForm />
         </section>
      </main>
   );
};

export default VisitRequestContent;
