"use client";
import * as Clerk from "@clerk/elements/common";
import * as SignUp from "@clerk/elements/sign-up";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/ui/icons";

export default function SignUpPage() {
  return (
    <div className="grid w-full grow items-center px-4 text-white max-sm:-mt-14 sm:justify-center">
      <SignUp.Root>
        <Clerk.Loading>
          {(isGlobalLoading) => (
            <div className="flex h-screen items-center justify-center">
              <SignUp.Step name="start">
                <Card className="w-full border border-zinc-700 bg-dark-200 text-white sm:w-96">
                  <CardHeader>
                    <CardTitle className="flex flex-col text-center text-xl sm:text-3xl">
                      <p>
                        <span className="text-primary-100">Dream</span>
                        Navigator
                      </p>
                    </CardTitle>
                    <CardDescription className="text-center">
                      Welcome! Please fill in the details to get started.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-y-4">
                    <div className="grid grid-cols-2 gap-x-4">
                      <Clerk.Connection name="apple" asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          type="button"
                          disabled={isGlobalLoading}
                          className="rounded-[7px] border-zinc-600 bg-dark-300 hover:bg-[#57494d] hover:text-white"
                        >
                          <Clerk.Loading scope="provider:apple">
                            {(isLoading) =>
                              isLoading ? (
                                <Icons.spinner className="size-4 animate-spin" />
                              ) : (
                                <>
                                  <Icons.apple className="mr-2 size-4" />
                                  Apple
                                </>
                              )
                            }
                          </Clerk.Loading>
                        </Button>
                      </Clerk.Connection>
                      <Clerk.Connection name="google" asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          type="button"
                          disabled={isGlobalLoading}
                          className="rounded-[7px] border-zinc-600 bg-dark-300 hover:bg-[#57494d] hover:text-white"
                        >
                          <Clerk.Loading scope="provider:google">
                            {(isLoading) =>
                              isLoading ? (
                                <Icons.spinner className="size-4 animate-spin" />
                              ) : (
                                <>
                                  <Icons.google className="mr-2 size-4" />
                                  Google
                                </>
                              )
                            }
                          </Clerk.Loading>
                        </Button>
                      </Clerk.Connection>
                    </div>
                    <p className="flex items-center gap-x-3 text-sm text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border">
                      or
                    </p>
                    <Clerk.Field name="emailAddress" className="space-y-2">
                      <Clerk.Label asChild>
                        <Label>Email address</Label>
                      </Clerk.Label>
                      <Clerk.Input type="email" required asChild>
                        <Input className="rounded-[7px] border-zinc-600" />
                      </Clerk.Input>
                      <Clerk.FieldError className="block text-sm text-destructive" />
                    </Clerk.Field>
                    <Clerk.Field name="password" className="space-y-2">
                      <Clerk.Label asChild>
                        <Label>Password</Label>
                      </Clerk.Label>
                      <Clerk.Input type="password" required asChild>
                        <Input className="rounded-[7px] border-zinc-600" />
                      </Clerk.Input>
                      <Clerk.FieldError className="block text-sm text-destructive" />
                    </Clerk.Field>
                  </CardContent>
                  <CardFooter>
                    <div className="grid w-full gap-y-4">
                      <SignUp.Captcha className="empty:hidden" />
                      <SignUp.Action submit asChild>
                        <Button
                          disabled={isGlobalLoading}
                          className="rounded-[7px] bg-primary-100 hover:bg-[#f81d42]"
                        >
                          <Clerk.Loading>
                            {(isLoading) => {
                              return isLoading ? (
                                <Icons.spinner className="size-4 animate-spin" />
                              ) : (
                                "Continue"
                              );
                            }}
                          </Clerk.Loading>
                        </Button>
                      </SignUp.Action>
                      <Button variant="link" size="sm" asChild>
                        <Link href="/sign-in">
                          Already have an account?{"  "}
                          <span className="ml-1 text-primary-100">
                            {" "}
                            Sign in
                          </span>
                        </Link>
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </SignUp.Step>

              <SignUp.Step name="continue">
                <Card className="w-full border border-zinc-700 bg-dark-200 sm:w-96">
                  <CardHeader>
                    <CardTitle>Continue registration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Clerk.Field name="username" className="space-y-2">
                      <Clerk.Label>
                        <Label>Username</Label>
                      </Clerk.Label>
                      <Clerk.Input type="text" required asChild>
                        <Input />
                      </Clerk.Input>
                      <Clerk.FieldError className="block text-sm text-destructive" />
                    </Clerk.Field>
                  </CardContent>
                  <CardFooter>
                    <div className="grid w-full gap-y-4">
                      <SignUp.Action submit asChild>
                        <Button
                          disabled={isGlobalLoading}
                          className="rounded-[7px] bg-primary-100 hover:bg-[#f81d42]"
                        >
                          <Clerk.Loading>
                            {(isLoading) => {
                              return isLoading ? (
                                <Icons.spinner className="size-4 animate-spin" />
                              ) : (
                                "Continue"
                              );
                            }}
                          </Clerk.Loading>
                        </Button>
                      </SignUp.Action>
                    </div>
                  </CardFooter>
                </Card>
              </SignUp.Step>

              <SignUp.Step name="verifications">
                <SignUp.Strategy name="email_code">
                  <Card className="w-full border-zinc-700 bg-dark-200 sm:w-96">
                    <CardHeader>
                      <CardTitle>Verify your email</CardTitle>
                      <CardDescription>
                        Use the verification link sent to your email address
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-y-4">
                      <div className="grid items-center justify-center gap-y-2">
                        <Clerk.Field name="code" className="space-y-2">
                          <Clerk.Label className="sr-only">
                            Email address
                          </Clerk.Label>
                          <div className="flex justify-center text-center">
                            <Clerk.Input
                              type="otp"
                              className="flex justify-center has-[:disabled]:opacity-50"
                              autoSubmit
                              render={({ value, status }) => {
                                return (
                                  <div
                                    data-status={status}
                                    className={cn(
                                      "relative bg-dark-medium flex size-10 items-center justify-center border-y border-r border-zinc-500 text-sm transition-all first:rounded-l-[6px] first:border-l last:rounded-r-[6px]",
                                      {
                                        "z-10 ring-2 ring-ring border-zinc-400 bg-dark-medium":
                                          status === "cursor" ||
                                          status === "selected",
                                      }
                                    )}
                                  >
                                    {value}
                                    {status === "cursor" && (
                                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                        <div className="h-4 w-px animate-caret-blink bg-white duration-1000" />
                                      </div>
                                    )}
                                  </div>
                                );
                              }}
                            />
                          </div>
                          <Clerk.FieldError className="block text-center text-sm text-destructive" />
                        </Clerk.Field>
                        <SignUp.Action
                          asChild
                          resend
                          className="text-muted-foreground"
                          fallback={({ resendableAfter }) => (
                            <Button variant="link" size="sm" disabled>
                              Didn&apos;t receive a code? Resend (
                              <span className="tabular-nums">
                                {resendableAfter}
                              </span>
                              )
                            </Button>
                          )}
                        >
                          <Button type="button" variant="link" size="sm">
                            Didn&apos;t receive a code? Resend
                          </Button>
                        </SignUp.Action>
                      </div>
                    </CardContent>
                    <CardFooter>
                      <div className="grid w-full gap-y-4">
                        <SignUp.Action submit asChild>
                          <Button
                            disabled={isGlobalLoading}
                            className="rounded-[7px] bg-primary-100 hover:bg-[#f81d42]"
                          >
                            <Clerk.Loading>
                              {(isLoading) => {
                                return isLoading ? (
                                  <Icons.spinner className="size-4 animate-spin" />
                                ) : (
                                  "Continue"
                                );
                              }}
                            </Clerk.Loading>
                          </Button>
                        </SignUp.Action>
                      </div>
                    </CardFooter>
                  </Card>
                </SignUp.Strategy>
              </SignUp.Step>
            </div>
          )}
        </Clerk.Loading>
      </SignUp.Root>
    </div>
  );
}
